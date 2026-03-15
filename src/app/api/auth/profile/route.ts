import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { profileSchema, passwordChangeSchema } from "@/lib/validations";
import bcryptjs from "bcryptjs";

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();

    // Password change
    if (body.currentPassword || body.newPassword) {
      const parsed = passwordChangeSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Données invalides" }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (!user) {
        return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
      }

      const validPassword = await bcryptjs.compare(parsed.data.currentPassword, user.password);
      if (!validPassword) {
        return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });
      }

      const hashedPassword = await bcryptjs.hash(parsed.data.newPassword, 10);
      await prisma.user.update({
        where: { id: session.user.id },
        data: { password: hashedPassword },
      });

      return NextResponse.json({ success: true, message: "Mot de passe modifié" });
    }

    // Profile update
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    // Check email uniqueness
    if (parsed.data.email !== session.user.email) {
      const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
      if (existing) {
        return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email,
      },
    });

    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
