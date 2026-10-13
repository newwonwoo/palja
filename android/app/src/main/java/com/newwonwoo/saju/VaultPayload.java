package com.newwonwoo.saju;

import android.util.JsonReader;
import android.util.JsonToken;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;

final class VaultPayload {
    static final int MAX_BYTES = 8 * 1024 * 1024;
    private static final int MAX_DEPTH = 64;

    private VaultPayload() {}

    static byte[] checkedBytes(String json) throws VaultException {
        if (json == null || json.length() > MAX_BYTES) {
            throw new VaultException(json == null ? "INVALID_JSON" : "PAYLOAD_TOO_LARGE", "저장할 JSON은 8MiB 이하여야 합니다.");
        }
        final ByteBuffer encoded;
        try {
            encoded = StandardCharsets.UTF_8.newEncoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT)
                .encode(CharBuffer.wrap(json));
        } catch (CharacterCodingException error) {
            throw new VaultException("INVALID_JSON", "문자 인코딩이 올바르지 않습니다.");
        }
        if (encoded.remaining() > MAX_BYTES) {
            throw new VaultException("PAYLOAD_TOO_LARGE", "저장할 JSON은 UTF-8 기준 8MiB 이하여야 합니다.");
        }
        validateObject(json);
        byte[] bytes = new byte[encoded.remaining()];
        encoded.get(bytes);
        return bytes;
    }

    static void validateObject(String json) throws VaultException {
        try (JsonReader reader = new JsonReader(new StringReader(json))) {
            validateLexicalJson(json);
            reader.setLenient(false);
            if (reader.peek() != JsonToken.BEGIN_OBJECT) {
                throw new IOException("JSON object required");
            }
            readValue(reader, 0);
            if (reader.peek() != JsonToken.END_DOCUMENT) {
                throw new IOException("Trailing content");
            }
        } catch (IOException | IllegalStateException | NumberFormatException error) {
            throw new VaultException("INVALID_JSON", "올바른 JSON 보관함 파일이 아닙니다.");
        }
    }

    // Android JsonReader accepts some nonstandard literals and escapes even when lenient
    // mode is disabled. Check the lexical grammar before its structure/duplicate-key pass.
    private static void validateLexicalJson(String json) throws IOException {
        int length = json.length();
        for (int index = 0; index < length;) {
            char token = json.charAt(index);
            if (isDelimiter(token)) {
                index++;
                continue;
            }
            if (token == '"') {
                index = quotedStringEnd(json, index + 1);
                continue;
            }
            if (token == '-' || isDigit(token)) {
                index = numberEnd(json, index);
            } else {
                String literal = token == 't' ? "true" : token == 'f' ? "false" : token == 'n' ? "null" : null;
                if (literal == null || !json.startsWith(literal, index)) throw new IOException("Invalid JSON literal");
                index += literal.length();
            }
            if (index < length && !isDelimiter(json.charAt(index))) throw new IOException("Invalid JSON token boundary");
        }
    }

    private static boolean isDelimiter(char character) {
        return character == ' ' || character == '\t' || character == '\r' || character == '\n'
            || character == '{' || character == '}' || character == '[' || character == ']'
            || character == ':' || character == ',';
    }

    private static boolean isDigit(char character) { return character >= '0' && character <= '9'; }

    private static int quotedStringEnd(String json, int index) throws IOException {
        while (index < json.length()) {
            char character = json.charAt(index++);
            if (character == '"') return index;
            if (character < 0x20) throw new IOException("Unescaped JSON control character");
            if (character != '\\') continue;
            if (index == json.length()) throw new IOException("Incomplete JSON escape");
            char escape = json.charAt(index++);
            if (escape == 'u') {
                if (index + 4 > json.length()) throw new IOException("Incomplete Unicode escape");
                for (int end = index + 4; index < end; index++) {
                    char hex = json.charAt(index);
                    if (!isDigit(hex) && !(hex >= 'a' && hex <= 'f') && !(hex >= 'A' && hex <= 'F')) {
                        throw new IOException("Invalid Unicode escape");
                    }
                }
            } else if (escape != '"' && escape != '\\' && escape != '/' && escape != 'b'
                && escape != 'f' && escape != 'n' && escape != 'r' && escape != 't') {
                throw new IOException("Invalid JSON escape");
            }
        }
        throw new IOException("Unterminated JSON string");
    }

    private static int numberEnd(String json, int index) throws IOException {
        int length = json.length();
        if (json.charAt(index) == '-') index++;
        if (index == length || !isDigit(json.charAt(index))) throw new IOException("Invalid JSON number");
        if (json.charAt(index) == '0') {
            index++;
        } else {
            while (index < length && isDigit(json.charAt(index))) index++;
        }
        if (index < length && json.charAt(index) == '.') {
            int firstDigit = ++index;
            while (index < length && isDigit(json.charAt(index))) index++;
            if (index == firstDigit) throw new IOException("Invalid JSON fraction");
        }
        if (index < length && (json.charAt(index) == 'e' || json.charAt(index) == 'E')) {
            index++;
            if (index < length && (json.charAt(index) == '+' || json.charAt(index) == '-')) index++;
            int firstDigit = index;
            while (index < length && isDigit(json.charAt(index))) index++;
            if (index == firstDigit) throw new IOException("Invalid JSON exponent");
        }
        return index;
    }

    private static void readValue(JsonReader reader, int depth) throws IOException {
        if (depth > MAX_DEPTH) throw new IOException("JSON nesting limit");
        switch (reader.peek()) {
            case BEGIN_OBJECT:
                reader.beginObject();
                Set<String> names = new HashSet<>();
                while (reader.hasNext()) {
                    if (!names.add(reader.nextName())) throw new IOException("Duplicate field");
                    readValue(reader, depth + 1);
                }
                reader.endObject();
                break;
            case BEGIN_ARRAY:
                reader.beginArray();
                while (reader.hasNext()) readValue(reader, depth + 1);
                reader.endArray();
                break;
            case STRING:
            case NUMBER:
                reader.nextString();
                break;
            case BOOLEAN:
                reader.nextBoolean();
                break;
            case NULL:
                reader.nextNull();
                break;
            default:
                throw new IOException("Unexpected JSON token");
        }
    }

    static String decodeUtf8(byte[] bytes) throws VaultException {
        try {
            String json = StandardCharsets.UTF_8.newDecoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT)
                .decode(ByteBuffer.wrap(bytes)).toString();
            return json.startsWith("\uFEFF") ? json.substring(1) : json;
        } catch (CharacterCodingException error) {
            throw new VaultException("INVALID_JSON", "UTF-8 형식의 JSON 파일을 선택해 주세요.");
        }
    }

    static byte[] readLimited(InputStream input) throws IOException, VaultException {
        if (input == null) throw new IOException("Document stream unavailable");
        ByteArrayOutputStream output = new ByteArrayOutputStream(64 * 1024);
        byte[] buffer = new byte[16 * 1024];
        int count;
        int total = 0;
        while ((count = input.read(buffer)) != -1) {
            total += count;
            if (total > MAX_BYTES) {
                throw new VaultException("PAYLOAD_TOO_LARGE", "선택한 파일이 8MiB를 넘습니다.");
            }
            output.write(buffer, 0, count);
        }
        return output.toByteArray();
    }

    static String safeFilename(String proposed) {
        String name = proposed == null ? "" : proposed.trim().replaceAll("[\\\\/:*?\"<>|\\p{Cntrl}]", "_");
        if (name.isEmpty() || name.equals(".") || name.equals("..")) name = "saju-vault-backup";
        if (name.codePointCount(0, name.length()) > 100) name = name.substring(0, name.offsetByCodePoints(0, 100));
        if (!name.toLowerCase(java.util.Locale.ROOT).endsWith(".json")) name += ".json";
        return name;
    }
}
