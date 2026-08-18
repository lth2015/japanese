/**
 * 活用规则的公共入口。`/verbs`、`/tango`、`/grammar` 三处都从这里取规则，
 * 保证同一个动词在任何页面上的变形结果逐字一致。
 */

export {
  ADJECTIVE_FORM_KEYS,
  ADJECTIVE_FORM_LABEL,
  ADJECTIVE_TYPE_LABEL,
  NA_ADJECTIVES_ENDING_IN_I,
  conjugateAdjective,
  type AdjectiveForm,
  type AdjectiveFormKey,
  type AdjectiveForms,
  type AdjectiveType,
} from "./adjective"
export {
  VERB_FORM_KEYS,
  VERB_FORM_LABEL,
  VERB_GROUP_LABEL,
  conjugateVerb,
  guessVerbGroup,
  type ConjugatedForm,
  type VerbFormKey,
  type VerbForms,
  type VerbGroup,
} from "./verb"
