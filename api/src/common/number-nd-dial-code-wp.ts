import {
  isValidPhoneNumber,
  parsePhoneNumber,
} from 'libphonenumber-js';

import { COUNTRIES } from './conntries';

function removeDialCode(phoneNumber: string) {
  // Loop through the list of dial codes
  for (let i = 0; i < COUNTRIES.length; i++) {
    // Check if the number starts with the current dial code
    if (phoneNumber.startsWith(COUNTRIES[i]) || phoneNumber.split("+").join("").startsWith((COUNTRIES[i]))) {
      // Remove the dial code from the phone number
      const numberWithoutDialCode = phoneNumber.slice(COUNTRIES[i].length);
      // Return an object with the dial code and the separated phone number
      return {
        dialCode: COUNTRIES[i] ?? 'unknown',
        number: numberWithoutDialCode ?? 'unknown',
      };
    }
  }
  // If no dial code is found, return null or handle the case appropriately
  return {
    dialCode: 'unknown',
    number: 'unknown',
  };
}

function mphone(n?: string) {
  if (!n) return "+";
  if (isValidPhoneNumber("+" + n.replace(/\D/g, ""))) {
    const phoneNumber = parsePhoneNumber("+" + n.replace(/\D/g, ""));
    if (phoneNumber) {
      return phoneNumber.formatInternational();
    } else {
      return "+" + n.replace(/\D/g, "");
    }
  } else {
    return  "+" + n.replace(/\D/g, "");
  }
}


function removeNumbeRemotejid(input: string): string {
  const [numberPart] = input.split('@');
  return numberPart.split(/[:|-]/)[0];
}

function extractInfoRemoteJid(text: string) {
  return removeDialCode(removeNumbeRemotejid(text));
}

export { extractInfoRemoteJid, mphone, removeDialCode, removeNumbeRemotejid };
