-- Orientation : qui l'utilisateur veut voir dans l'accueil.
-- 'F' = femmes, 'H' = hommes, 'all' = tout le monde.
-- NULL => déduit automatiquement du genre (H->F, F->H, A->all) côté serveur.
alter table profiles add column if not exists seeking text;
