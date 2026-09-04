
package com.javaweb.api;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.javaweb.Beans.BuildingDTO;

@RestController
public class BuildingAPI {
    // GET: Lấy dữ liệu
    // POST: Thêm dữ liệu.
    // PUT: Sửa dữ liệu
    // DELETE: Xóa dữ liệu
    @GetMapping(value = "/api/building/")
    public BuildingDTO getBuilding(
            @RequestParam(value = "name", required = false) String nameBuilding,
            @RequestParam(value = "numberOfBasement", required = false) Integer numberOfBasement,
            @RequestParam(value = "ward", required = false) String ward) {
        // xu ly duoi DB xong roi
        BuildingDTO result = new BuildingDTO();
        result.setName(nameBuilding);
        result.setNumberOfBasement(numberOfBasement);
        result.setWard(ward);
        return result;
    }
    @PostMapping(value = "/api/building/")
    public void getBuilding2(@RequestParam BuildingDTO buidingDTO) {
        System.out.print("ok");
    }

    @DeleteMapping(value = "/api/building/{id}/{name}/")
    public void deleteBuilding(
            @PathVariable Integer id,
            @PathVariable String name,
            @RequestParam(value = "ward", required = false) String ward) {
        System.out.print("Da xoa toa nha co id la " + id + " roi nhe!");
    }
}

