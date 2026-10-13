package com.newwonwoo.saju;

final class VaultException extends Exception {
    final String code;
    final Integer actualRevision;

    VaultException(String code, String message) {
        this(code, message, null);
    }

    VaultException(String code, String message, Integer actualRevision) {
        super(message);
        this.code = code;
        this.actualRevision = actualRevision;
    }
}
