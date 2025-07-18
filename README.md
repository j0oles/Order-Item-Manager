# Order-Item-Manager

> Salesforce DX Project - LWC, Apex et Flows pour la gestion dynamique d’Order Items

Ce projet permet de gérer les lignes de commande (OrderItems) dans Salesforce à travers une interface intuitive basée sur des **composants Lightning Web Components (LWC)**, des **classes Apex**, et des **flows interactifs**.

---

## 🚀 Objectifs fonctionnels

- Sélection de produits depuis un Pricebook personnalisé
- Ajout rapide de lignes OrderItem avec quantités et prix dynamiques
- Flow de validation et de mise à jour en masse
- UI moderne pour les utilisateurs internes Salesforce

---

## ⚙️ Installation locale (Scratch Org)

```bash
git clone https://github.com/j0oles/Order-Item-Manager.git
cd Order-Item-Manager
sfdx force:org:create -s -f config/project-scratch-def.json -a order-item
sfdx force:source:push
sfdx force:org:open