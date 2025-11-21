#!/usr/bin/env python3
"""
Extract splits from Garmin FIT files.
This script reads FIT files and extracts split data (typically 1km or 1 mile segments).
"""

import sys
import json
import os
from pathlib import Path

# Use garmindb's Python environment which has fitparse
try:
    from fitparse import FitFile
except ImportError:
    print(json.dumps({"error": "fitparse not available. Install with: pip install fitparse"}))
    sys.exit(1)


def extract_splits_from_fit(fit_file_path, split_distance_meters=1000):
    """
    Extract splits from a FIT file.
    
    Args:
        fit_file_path: Path to the FIT file
        split_distance_meters: Distance for each split (1000 for 1km, 1609.34 for 1 mile)
    
    Returns:
        List of split dictionaries
    """
    splits = []
    
    try:
        fitfile = FitFile(fit_file_path)
        
        # Get all records (GPS/HR data points)
        records = []
        for record in fitfile.get_messages('record'):
            record_data = {}
            for field in record:
                record_data[field.name] = field.value
            records.append(record_data)
        
        if not records:
            return splits
        
        # Sort records by distance (if available)
        records_with_distance = [r for r in records if 'distance' in r and r['distance'] is not None]
        if not records_with_distance:
            return splits
        
        # Group records into splits based on distance
        current_split = 1
        split_start_distance = records_with_distance[0]['distance']
        split_records = []
        
        for record in records_with_distance:
            current_distance = record['distance']
            distance_in_split = current_distance - split_start_distance
            
            split_records.append(record)
            
            # Check if we've reached the split distance
            if distance_in_split >= split_distance_meters or record == records_with_distance[-1]:
                # Calculate split metrics
                if split_records:
                    split_data = calculate_split_metrics(split_records, current_split, distance_in_split)
                    if split_data:
                        splits.append(split_data)
                
                # Start next split
                current_split += 1
                split_start_distance = current_distance
                split_records = [record]
        
    except Exception as e:
        print(json.dumps({"error": f"Error parsing FIT file: {str(e)}"}), file=sys.stderr)
        return splits
    
    return splits


def calculate_split_metrics(records, split_number, distance):
    """Calculate metrics for a split from its records."""
    if not records:
        return None
    
    # Get timestamps
    timestamps = [r.get('timestamp') for r in records if 'timestamp' in r]
    if not timestamps or len(timestamps) < 2:
        return None
    
    start_time = timestamps[0]
    end_time = timestamps[-1]
    
    # Calculate elapsed time
    if isinstance(start_time, str):
        from datetime import datetime
        start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
    else:
        start_dt = start_time
        end_dt = end_time
    
    elapsed_seconds = (end_dt - start_dt).total_seconds()
    hours = int(elapsed_seconds // 3600)
    minutes = int((elapsed_seconds % 3600) // 60)
    seconds = int(elapsed_seconds % 60)
    elapsed_time = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    
    # Calculate averages
    # Speed might be stored as 'speed' or 'enhanced_speed', and is in m/s
    speeds = []
    for r in records:
        speed = r.get('enhanced_speed') or r.get('speed')
        if speed is not None and speed > 0:
            speeds.append(speed)
    
    heart_rates = [r.get('heart_rate') for r in records if r.get('heart_rate') is not None and r.get('heart_rate') > 0]
    cadences = [r.get('cadence') for r in records if r.get('cadence') is not None and r.get('cadence') > 0]
    altitudes = [r.get('altitude') for r in records if r.get('altitude') is not None]
    
    # Calculate speed from distance/time if not available
    if not speeds and distance > 0 and elapsed_seconds > 0:
        avg_speed = distance / elapsed_seconds  # m/s
    else:
        avg_speed = sum(speeds) / len(speeds) if speeds else None
    max_speed = max(speeds) if speeds else None
    avg_hr = int(sum(heart_rates) / len(heart_rates)) if heart_rates else None
    max_hr = max(heart_rates) if heart_rates else None
    avg_cadence = int(sum(cadences) / len(cadences)) if cadences else None
    max_cadence = max(cadences) if cadences else None
    
    # Calculate elevation change
    ascent = 0
    descent = 0
    if len(altitudes) > 1:
        for i in range(1, len(altitudes)):
            diff = altitudes[i] - altitudes[i-1]
            if diff > 0:
                ascent += diff
            else:
                descent += abs(diff)
    
    return {
        "split": split_number,
        "distance": distance,
        "elapsed_time": elapsed_time,
        "moving_time": elapsed_time,  # Approximate
        "avg_speed": avg_speed,
        "max_speed": max_speed,
        "avg_hr": avg_hr,
        "max_hr": max_hr,
        "avg_cadence": avg_cadence,
        "max_cadence": max_cadence,
        "ascent": ascent if ascent > 0 else None,
        "descent": descent if descent > 0 else None,
    }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: extract_splits.py <fit_file_path> [split_distance_meters]"}))
        sys.exit(1)
    
    fit_file_path = sys.argv[1]
    split_distance = float(sys.argv[2]) if len(sys.argv) > 2 else 1000.0
    
    if not os.path.exists(fit_file_path):
        print(json.dumps({"error": f"FIT file not found: {fit_file_path}"}))
        sys.exit(1)
    
    splits = extract_splits_from_fit(fit_file_path, split_distance)
    print(json.dumps({"splits": splits}, indent=2))


if __name__ == "__main__":
    main()

