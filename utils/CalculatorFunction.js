//function pour calculer PRIX TTC AVEC TVA = 0.2

function calculePrixTottc(prix_hors_taxe,tva) {
    
    tva = 0.2;
    const calcule_montant_tva = prix_hors_taxe * tva;
    const calcule_ttc = prix_hors_taxe + calcule_montant_tva;
    return calcule_ttc;

}



