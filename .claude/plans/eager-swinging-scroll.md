# Plan : Éditeur de mise en page en live + Fix tri des lots

## Contexte
L'utilisateur veut pouvoir **modifier tous les détails de la présentation du CR en temps réel** depuis un aperçu live — couleurs, tailles de colonnes, polices, ordres, etc. — et sauvegarder ces réglages. Le bouton "Modèles" actuel ne correspond pas au besoin : il ne gère que le contenu des généralités, pas la mise en page.

Par ailleurs, le tri des lots par numéro ne fonctionne pas (bug à corriger).

---

## Partie 1 : Fix du tri des lots (bug)

### Problème
Les sections et la liste de présence sont triées côté serveur par `sortOrder` (un champ manuel sur Company) au lieu de `lotNumber`. Le tri client-side dans le preview existe mais ne semble pas s'appliquer correctement.

### Solution
1. **Côté serveur** — Modifier les queries Prisma dans `page.tsx` et `pdf/route.tsx` pour trier par `company.lotNumber` au lieu de `company.sortOrder`
2. **Côté éditeur** — Trier aussi les attendances dans le panneau latéral du meeting-report-editor
3. **Côté preview/PDF** — Garder le tri client-side en backup

### Fichiers
- `src/app/(app)/comptes-rendus/[id]/page.tsx` — orderBy → `company.lotNumber`
- `src/app/api/meeting-reports/[id]/pdf/route.tsx` — idem
- `src/app/(app)/comptes-rendus/[id]/meeting-report-editor.tsx` — trier `attendances` par lotNumber dans le panneau

---

## Partie 2 : Éditeur de mise en page en live

### Concept
Remplacer le modal d'aperçu actuel (simple preview en lecture seule) par un **éditeur de mise en page split-screen** :

```
┌─────────────────────────────────────────────────────────┐
│  Mise en page — CR n°1          [Sauvegarder] [Fermer]  │
├────────────────────┬────────────────────────────────────┤
│                    │                                    │
│  Panneau réglages  │         Aperçu live (preview)     │
│  (scroll, ~320px)  │         (scroll, fond gris)       │
│                    │                                    │
│  ▸ Couverture      │    ┌────────────────────────┐     │
│  ▸ Couleurs        │    │                        │     │
│  ▸ Présence        │    │    Rendu HTML temps    │     │
│  ▸ Observations    │    │    réel du CR          │     │
│  ▸ Polices         │    │                        │     │
│  ▸ Pied de page    │    └────────────────────────┘     │
│                    │                                    │
└────────────────────┴────────────────────────────────────┘
```

### Sections du panneau de réglages

**1. Couverture**
- Afficher la page de couverture (toggle)
- Titre et sous-titre
- Description du projet
- Adresse du chantier
- Photo du chantier (upload base64)

**2. En-tête & Logo**
- Logo (upload base64)
- Nom de l'entreprise
- Adresse de l'entreprise

**3. Couleurs & Style**
- Couleur d'accentuation (color picker + input hex)
- Police (select: Helvetica, Arial, Times — celles supportées par @react-pdf)

**4. Tableau de présence**
- Largeurs des 5 colonnes (inputs %)
- Afficher les contacts (toggle)
- Afficher la colonne convocation (toggle)

**5. Observations**
- Largeurs des 3 colonnes (inputs %)
- Catégories à afficher (checkboxes)

**6. Pied de page**
- Texte de pied de page (input)

### Implémentation

#### Nouveau composant : `layout-editor.tsx`
**Fichier** : `src/app/(app)/comptes-rendus/[id]/layout-editor.tsx`

- Composant client, modal plein écran (comme le preview actuel mais en split-screen)
- État local `settings` initialisé depuis `pdfSettings` du projet
- Chaque modification met à jour `settings` → le preview se re-render en temps réel
- Bouton "Sauvegarder" → PUT `/api/settings/pdf` avec les settings modifiés
- Les settings sont passés au `MeetingReportPreview` en props

```typescript
interface LayoutEditorProps {
  report: MeetingReport;
  projectName: string;
  previousReportNumber: number | null;
  pdfSettings: PdfSettings;
  onClose: () => void;
  onSave: (settings: PdfSettings) => void;
}
```

#### Modifications au `meeting-report-editor.tsx`
- Remplacer le bouton "Aperçu" par "Mise en page" (ouvre le layout editor)
- Garder le bouton "Télécharger PDF" tel quel
- Supprimer le bouton "Modèles" de la section généralités (plus besoin)
- Ajouter un state `showLayoutEditor` + `pdfSettings` (mutable)
- Quand on sauvegarde dans le layout editor → mettre à jour `pdfSettings` dans l'état

#### Suppression du template system pour les généralités
- Supprimer le bouton "Modèles" et "Sauvegarder" de la section généralités
- Garder uniquement l'éditeur Tiptap + auto-save
- Optionnel : supprimer l'API `/api/meeting-templates` et le modèle Prisma (nettoyage)

### Fichiers impactés
- `src/app/(app)/comptes-rendus/[id]/layout-editor.tsx` — **NOUVEAU** — Éditeur split-screen
- `src/app/(app)/comptes-rendus/[id]/meeting-report-editor.tsx` — Intégrer le layout editor, supprimer templates
- `src/components/meeting-report-preview.tsx` — Ajouter support props optionnelles (police, toggles colonnes)
- `src/lib/pdf/meeting-report-pdf.tsx` — Ajouter support mêmes props
- `src/app/api/settings/pdf/route.ts` — Accepter les nouveaux champs (fontFamily, showContacts, showConvocation, visibleCategories)

### PdfSettings étendu
```typescript
interface PdfSettings {
  // Existants
  logoUrl?: string;
  companyName?: string;
  companyAddress?: string;
  headerColor?: string;
  showCoverPage?: boolean;
  coverTitle?: string;
  coverSubtitle?: string;
  footerText?: string;
  sitePhotoUrl?: string;
  siteAddress?: string;
  projectDescription?: string;
  columnWidths?: ColumnWidths;
  // Nouveaux
  fontFamily?: string;        // "Helvetica" | "Times-Roman" | "Courier"
  showContacts?: boolean;     // afficher phone/email dans présence
  showConvocation?: boolean;  // afficher colonne convocation
  visibleCategories?: string[]; // catégories à afficher dans observations
}
```

---

## Séquence d'implémentation

1. **Fix tri des lots** — Modifier les orderBy server-side + tri dans le panneau attendances
2. **Créer `layout-editor.tsx`** — Split-screen avec panneau réglages + preview live
3. **Intégrer dans `meeting-report-editor.tsx`** — Remplacer le bouton Aperçu, supprimer templates
4. **Étendre `PdfSettings`** — Nouveaux champs dans preview, PDF, API
5. **Build + test**

---

## Vérification
- Ouvrir un CR → Les lots doivent être dans l'ordre 1, 2, 3, 4
- Cliquer "Mise en page" → Split-screen s'ouvre
- Modifier la couleur → Le preview se met à jour immédiatement
- Modifier les largeurs de colonnes → Changement visible en temps réel
- Sauvegarder → Fermer et ré-ouvrir → Les réglages sont conservés
- Exporter PDF → Le PDF utilise les mêmes réglages que le preview
