-- Localisation hiérarchique : région (obligatoire) + commune/quartier (city, optionnel).
alter table profiles add column if not exists region text;
