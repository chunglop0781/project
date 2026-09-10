
package com.javaweb.api;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.ArrayList;

import com.javaweb.Beans.BuildingDTO;
import com.javaweb.Beans.ErrorResponseDTO;

import customexception.FieldRequiredException;

@RestController
public class BuildingAPI {

//	@GetMapping(value="/api/building/")
//	public Object getBuilding(@RequestParam(value="name", required = false) String nameBuilding,
//	                               @RequestParam(value="numberOfBasement", required = false) Integer numberOfBasement,
//	                               @RequestParam(value="ward", required = false) String ward) {
//	    // //xu ly duoi DB xong roi
//	    try {
//	    	BuildingDTO building = null;
//			valiDate(building);
//	    } catch (Exception e) {
//	    	ErrorResponseDTO errorResponseDTO = new ErrorResponseDTO();
//	        errorResponseDTO.setError(e.getMessage());
//	        List<String> details = new ArrayList<>();
//	        details.add("Check lại name hoặc numberofbasement đi bởi vì đang bị null đó!");
//	        errorResponseDTO.setDetail(details);
//	        return errorResponseDTO;
//	    }
//	    return null;
//	}
//
//	public void valiDate(BuildingDTO buildingDTO) throws FieldRequiredException {
//	    if(buildingDTO.getName() == null || buildingDTO.getName().equals("") || buildingDTO.getNumberOfBasement() == null) {
//	    	throw new FieldRequiredException("name or numberofbasement is null");
//	    }
//	}



//    @PostMapping(value = "/api/building/")
//    public BuildingDTO getBuilding2(@RequestBody BuildingDTO building) {
//        // sau khi xu ly duoi DB
//        return building;
//    }
	
	
	@PostMapping(value="/api/building/")
	public Object getBuilding(@RequestParam(value="name", required = false) String nameBuilding,
	                               @RequestParam(value="numberOfBasement", required = false) Integer numberOfBasement,
	                               @RequestParam(value="ward", required = false) String ward) {
	    // //xu ly duoi DB xong roi
	    try {
	    	BuildingDTO building = null;
			valiDate(building);
	    } catch (Exception e) {
	    	ErrorResponseDTO errorResponseDTO = new ErrorResponseDTO();
	        errorResponseDTO.setError(e.getMessage());
	        List<String> details = new ArrayList<>();
	        details.add("Check lại name hoặc numberofbasement đi bởi vì đang bị null đó!");
	        errorResponseDTO.setDetail(details);
	        return errorResponseDTO;
	    }
	    return null;
	}

	
	
	
	public void valiDate(BuildingDTO buildingDTO) throws FieldRequiredException {
	    if(buildingDTO.getName() == null || buildingDTO.getName().equals("") || buildingDTO.getNumberOfBasement() == null) {
	    	throw new FieldRequiredException("name or numberofbasement is null");
	    }
	}
	
	
	
    @DeleteMapping(value="/api/building/{id}/{name}/")
    public void deleteBuilding(@PathVariable Integer id,
                               @PathVariable String name,
                               @RequestParam(value="ward", required = false) String ward) {
        System.out.print("Da xoa toa nha co id la "+ id +" roi nhe!");
    }

}

