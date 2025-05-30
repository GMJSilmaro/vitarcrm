import {
  Briefcase,
  Building,
  CardList,
  ChatLeftText,
  EnvelopePaper,
  ListColumns,
  People,
  PersonVcard,
  Tools,
  WrenchAdjustable,
} from 'react-bootstrap-icons';

export const NOTIFICATION_ICON_MAP = {
  customer: People,
  site: Building,
  job: Briefcase,
  user: PersonVcard,
  equipment: Tools,
  'customer-equipment': WrenchAdjustable,
  'job-request': EnvelopePaper,
  calibration: CardList,
  'calibration-reference': ListColumns,
  default: ChatLeftText,
};
