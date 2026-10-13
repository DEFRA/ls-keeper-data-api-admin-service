import {
  createAll,
  Button,
  Checkboxes,
  ErrorSummary,
  PasswordInput,
  Radios,
  ServiceNavigation,
  SkipLink
} from 'govuk-frontend'

import { createHoldingsProbe } from './holdings-probe.js'

createAll(Button)
createAll(Checkboxes)
createAll(ErrorSummary)
createAll(PasswordInput)
createAll(Radios)
createAll(ServiceNavigation)
createAll(SkipLink)

createHoldingsProbe()
