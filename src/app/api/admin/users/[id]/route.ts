import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireGlobalAdmin, getUserId } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireGlobalAdmin();
    const { id } = await params;
    const currentUserId = await getUserId();
    const body = await request.json();

    // Prevent removing own admin status
    if (id === currentUserId && body.isGlobalAdmin === false) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas retirer vos propres droits administrateur" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(typeof body.isGlobalAdmin === "boolean" && {
          isGlobalAdmin: body.isGlobalAdmin,
        }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isGlobalAdmin: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Accès refusé") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireGlobalAdmin();
    const { id } = await params;
    const currentUserId = await getUserId();

    if (id === currentUserId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer votre propre compte" },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Accès refusé") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
