package com.javaweb.api;

import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

import com.javaweb.Beans.BuildingDTO;
//import com.sun.jdi.connect.spi.Connection;
//import com.sun.tools.javac.util.List;
import java.sql.Connection;
import java.util.ArrayList;
import java.util.List;

import customexception.FieldRequiredException;

@RestController
public class BuildingAPI {

	static final String DB_URL = "jdbc:mysql://localhost:3306/estatebasic";
	static final String USER = "root";
	static final String PASS = "123456";



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
	public List<BuildingDTO> getBuilding() {
		String sql = "SELECT * FROM building";
		List<BuildingDTO> result = new ArrayList<>();
//		BuildingDTO building;
		//	public Object getBuilding(@RequestBody BuildingDTO building) {
	    //xu ly duoi DB xong roi
//	    valiDate(building);
		try(Connection conn = DriverManager.getConnection(DB_URL, USER, PASS);
				Statement stmt = conn.createStatement();
				ResultSet rs = stmt.executeQuery(sql)) {   // <-- ĐÃ BỎ dấu ; thừa
			while(rs.next()) {
				
			}
			
//		    System.out.println("Connected database successfully...");
		} catch (SQLException e) {
		    e.printStackTrace();
		    System.out.println("Connected database failed...");
		}
	    return null;
	}


	
	
	
	public void valiDate(BuildingDTO buildingDTO) {
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