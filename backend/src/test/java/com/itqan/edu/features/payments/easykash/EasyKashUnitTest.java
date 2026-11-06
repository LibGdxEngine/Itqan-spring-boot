package com.itqan.edu.features.payments.easykash;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class EasyKashUnitTest {

    private static final String SECRET = "da9fe30575517d987762a859842b5631";
    /** The worked example from EasyKash's "Callback response verification" page. */
    private static final String DOCS_EXAMPLE = """
            {"ProductCode":"EDV4471","Amount":"11.00","ProductType":"Direct Pay","PaymentMethod":"Cash Through Fawry",
             "BuyerName":"mee","BuyerEmail":"test@mail.com","BuyerMobile":"0123456789","status":"PAID","voucher":"",
             "easykashRef":"2911105009","VoucherData":"Direct Pay","customerReference":"TEST11111",
             "signatureHash":"0bd9ce502950ffa358314c170dace42e7ba3e0c776f5a32eb15c3d496bc9c294835036dd90d4f287233b800c9bde2f6591b6b8a1f675b6bfe64fd799da29d1d0"}
            """;

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void signature_matchesTheDocumentedExample() throws Exception {
        assertThat(EasyKashSignature.matches(mapper.readTree(DOCS_EXAMPLE), SECRET)).isTrue();
    }

    @Test
    void signature_rejectsTamperingWrongSecretAndMissingHash() throws Exception {
        JsonNode tampered = mapper.readTree(DOCS_EXAMPLE.replace("TEST11111", "TEST22222"));
        assertThat(EasyKashSignature.matches(tampered, SECRET)).isFalse();
        assertThat(EasyKashSignature.matches(mapper.readTree(DOCS_EXAMPLE), "other")).isFalse();
        assertThat(EasyKashSignature.matches(mapper.readTree(DOCS_EXAMPLE), "")).isFalse();
        assertThat(EasyKashSignature.matches(mapper.readTree("{\"status\":\"PAID\"}"), SECRET)).isFalse();
    }

    @Test
    void statuses_mapToOutcomesAndUnknownStaysPending() {
        assertThat(EasyKashResult.outcomeOf("PAID")).isEqualTo(EasyKashResult.Outcome.PAID);
        assertThat(EasyKashResult.outcomeOf("DELIVERED")).isEqualTo(EasyKashResult.Outcome.PAID);
        assertThat(EasyKashResult.outcomeOf("NEW")).isEqualTo(EasyKashResult.Outcome.PENDING);
        assertThat(EasyKashResult.outcomeOf("something-new")).isEqualTo(EasyKashResult.Outcome.PENDING);
        for (String closed : new String[] {"EXPIRED", "FAILED", "CANCELED", "REFUNDED"}) {
            assertThat(EasyKashResult.outcomeOf(closed)).isEqualTo(EasyKashResult.Outcome.FAILED);
        }
    }

    @Test
    void mobile_isNormalizedToLocalForm() {
        assertThat(EasyKashMobile.normalize("01012345678")).isEqualTo("01012345678");
        assertThat(EasyKashMobile.normalize("+20 101 234 5678")).isEqualTo("01012345678");
        assertThat(EasyKashMobile.normalize("00201012345678")).isEqualTo("01012345678");
        assertThat(EasyKashMobile.normalize("201012345678")).isEqualTo("01012345678");
        assertThat(EasyKashMobile.normalize("٠١٠١٢٣٤٥٦٧٨")).isEqualTo("01012345678");
        assertThat(EasyKashMobile.normalize("+966 50 123 4567")).isEqualTo("+966501234567");
    }

    @Test
    void mobile_rejectsWhatIsNotAPhoneNumber() {
        assertThat(EasyKashMobile.normalize(null)).isNull();
        assertThat(EasyKashMobile.normalize("")).isNull();
        assertThat(EasyKashMobile.normalize("12345")).isNull();
        assertThat(EasyKashMobile.normalize("call me")).isNull();
        assertThat(EasyKashMobile.normalize("0101234567890123456")).isNull();
    }
}
