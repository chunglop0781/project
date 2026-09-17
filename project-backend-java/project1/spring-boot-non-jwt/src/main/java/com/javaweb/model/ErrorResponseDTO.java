package com.javaweb.model;

import java.util.ArrayList;
import java.util.List;

public class ErrorResponseDTO {
    private String error;
    private List<String> detail = new ArrayList<>();

    // Constructor không tham số
    public ErrorResponseDTO() {
    }

    // Constructor đầy đủ tham số
    public ErrorResponseDTO(String error, List<String> detail) {
        this.error = error;
        this.detail = detail;
    }

    // Getter và Setter
    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public List<String> getDetail() {
        return detail;
    }

    public void setDetail(List<String> detail) {
        this.detail = detail;
    }
}

