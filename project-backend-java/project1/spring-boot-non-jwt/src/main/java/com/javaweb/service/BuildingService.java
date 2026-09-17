package com.javaweb.service;

import java.util.List;

import com.javaweb.model.BuildingDTO;
import com.javaweb.repository.entity.BuildingEntity;

public interface BuildingService {
	public List<BuildingDTO> findAll(String name);
}
