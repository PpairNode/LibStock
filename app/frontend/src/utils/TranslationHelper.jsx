import i18n from '../components/Translation';

export const getConditionLabel = (conditionValue) => {
  const conditionMap = {
    "New": "item_condition_value_new",
    "Very Good": "item_condition_value_very_good",
    "Good": "item_condition_value_good",
    "Used": "item_condition_value_used",
    "Damaged": "item_condition_value_damaged",
    "Heavily Damaged": "item_condition_value_heavily_damaged"
  };
  return i18n.t(conditionMap[conditionValue] || conditionValue);
};

// Liste des conditions disponibles (réutilisable)
export const CONDITIONS = [
  "New",
  "Very Good",
  "Good",
  "Used",
  "Damaged",
  "Heavily Damaged"
];
