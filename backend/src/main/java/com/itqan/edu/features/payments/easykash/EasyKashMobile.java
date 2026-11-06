package com.itqan.edu.features.payments.easykash;

/** Puts a typed mobile number into the local form EasyKash's examples use (01012345678). */
public final class EasyKashMobile {

    private EasyKashMobile() {
    }

    /** Returns the cleaned number, or null when it isn't a plausible phone number. */
    public static String normalize(String input) {
        if (input == null) {
            return null;
        }
        String trimmed = input.trim();
        StringBuilder digits = new StringBuilder();
        for (int i = 0; i < trimmed.length(); i++) {
            char c = trimmed.charAt(i);
            int digit = Character.digit(c, 10); // Also accepts Arabic-Indic digits from Arabic keyboards.
            if (digit >= 0) {
                digits.append(digit);
            } else if (" -().".indexOf(c) < 0 && !(c == '+' && i == 0)) {
                return null;
            }
        }
        String number = digits.toString();
        if (number.startsWith("0020")) {
            number = "0" + number.substring(4);
        } else if (trimmed.startsWith("+20") || number.startsWith("201") && number.length() == 12) {
            number = "0" + number.substring(2);
        } else if (trimmed.startsWith("+")) {
            number = "+" + number;
        }
        int length = number.replace("+", "").length();
        return length >= 8 && length <= 15 ? number : null;
    }
}
