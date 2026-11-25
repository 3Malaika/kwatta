import type { ReportStatus, WasteType, Volume } from "./types";

export const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: "En attente",
  accepted: "Acceptée",
  en_route: "En route",
  collected: "Collectée",
  paid: "Payée",
  cancelled: "Annulée",
};

export const WASTE_LABELS: Record<WasteType, string> = {
  menagers: "Déchets ménagers",
  organiques: "Déchets organiques",
  plastiques: "Plastiques",
  cartons: "Cartons & emballages",
  encombrants: "Encombrants",
};

export const VOLUME_LABELS: Record<Volume, { title: string; hint: string }> = {
  1: { title: "Petit", hint: "1 à 3 sacs" },
  2: { title: "Moyen", hint: "Brouette / tas" },
  3: { title: "Grand", hint: "Plein camion" },
};
