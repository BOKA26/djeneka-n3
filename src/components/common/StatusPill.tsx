import React from 'react';
import { Badge, BadgeVariant } from './Badge';

interface StatusPillProps {
  status: string;
  type?: 'reservation' | 'emergency' | 'stock' | 'quote' | 'engine';
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, type = 'reservation' }) => {
  let label = status;
  let variant: BadgeVariant = 'default';

  // Stock badges
  if (type === 'stock') {
    switch (status) {
      case 'in_stock':
        label = 'En stock';
        variant = 'success';
        break;
      case 'on_order':
        label = 'Sur commande';
        variant = 'warning';
        break;
      case 'out_of_stock':
        label = 'Indisponible';
        variant = 'default';
        break;
    }
  } else if (type === 'reservation') {
    switch (status) {
      case 'en_attente':
        label = 'En attente';
        variant = 'warning';
        break;
      case 'confirmee':
        label = 'Confirmée';
        variant = 'success';
        break;
      case 'en_cours':
        label = 'En cours';
        variant = 'info';
        break;
      case 'terminee':
        label = 'Terminée';
        variant = 'default';
        break;
      case 'refusee':
        label = 'Refusée';
        variant = 'danger';
        break;
      case 'annulee':
        label = 'Annulée';
        variant = 'default';
        break;
    }
  } else if (type === 'emergency') {
    switch (status) {
      case 'demande_envoyee':
        label = 'Demande envoyée';
        variant = 'warning';
        break;
      case 'prise_en_charge':
        label = 'Prise en charge';
        variant = 'info';
        break;
      case 'depanneur_en_route':
        label = 'Dépanneur en route';
        variant = 'danger';
        break;
      case 'termine':
        label = 'Terminé';
        variant = 'success';
        break;
    }
  } else if (type === 'quote') {
    switch (status) {
      case 'nouveau':
        label = 'Nouveau devis';
        variant = 'danger';
        break;
      case 'en_cours':
        label = 'En cours';
        variant = 'warning';
        break;
      case 'traite':
        label = 'Traité';
        variant = 'success';
        break;
    }
  } else if (type === 'engine') {
    switch (status) {
      case 'en_attente':
        label = 'Reçu';
        variant = 'warning';
        break;
      case 'en_recherche':
        label = 'En recherche';
        variant = 'info';
        break;
      case 'devis_envoye':
        label = 'Devis envoyé';
        variant = 'navy';
        break;
      case 'confirme':
        label = 'Confirmé';
        variant = 'success';
        break;
      case 'livre':
        label = 'Livré';
        variant = 'default';
        break;
    }
  }

  return (
    <Badge variant={variant} dot>
      {label}
    </Badge>
  );
};
