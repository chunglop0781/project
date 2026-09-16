package com.javaweb.Beans;

public class BuildingDTO {

    private String name;
    private Integer numberOfBasement;
    private String ward;
    private String street;

    public BuildingDTO() {
    }

    public BuildingDTO(String name, Integer numberOfBasement, String ward, String street) {
        this.name = name;
        this.numberOfBasement = numberOfBasement;
        this.ward = ward;
        this.street = street;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getNumberOfBasement() {
        return numberOfBasement;
    }

    public void setNumberOfBasement(Integer numberOfBasement) {
        this.numberOfBasement = numberOfBasement;
    }

    public String getWard() {
        return ward;
    }

    public void setWard(String ward) {
        this.ward = ward;
    }

    public String getStreet() {
        return street;
    }

    public void setStreet(String street) {
        this.street = street;
    }

    @Override
    public String toString() {
        return "BuildingDTO{" +
                "name='" + name + '\'' +
                ", numberOfBasement=" + numberOfBasement +
                ", ward='" + ward + '\'' +
                ", street='" + street + '\'' +
                '}';
    }
}