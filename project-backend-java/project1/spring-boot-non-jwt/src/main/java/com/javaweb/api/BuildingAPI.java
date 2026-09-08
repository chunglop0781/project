
package com.javaweb.api;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.ArrayList;

import com.javaweb.Beans.BuildingDTO;

@RestController
public class BuildingAPI {

    @GetMapping(value = "/api/building/")
    public List<BuildingDTO> getBuilding(
            @RequestParam(value = "name", required = false) String nameBuilding,
            @RequestParam(value = "numberOfBasement", required = false) Integer numberOfBasement,
            @RequestParam(value = "ward", required = false) String ward) {
        // xu ly duoi DB xong roi
        // For demonstration, create a list with one BuildingDTO
    	List<BuildingDTO> listBuildings = new ArrayList<>();
    	BuildingDTO buildingDT01 = new BuildingDTO();
    	buildingDT01.setName("ABC Building");
    	buildingDT01.setNumberOfBasement(3);
    	buildingDT01.setWard("Tan Mai");
    	BuildingDTO buildingDT02 = new BuildingDTO();
    	buildingDT02.setName("ACM Tower");
    	buildingDT02.setNumberOfBasement(2);
    	buildingDT02.setWard("Da Cao");
    	listBuildings.add(buildingDT01);
    	listBuildings.add(buildingDT02);
    	return listBuildings;
    }

    @PostMapping(value = "/api/building/")
    public BuildingDTO getBuilding2(@RequestBody BuildingDTO building) {
        // sau khi xu ly duoi DB
        return building;
    }
}

