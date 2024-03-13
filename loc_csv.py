import json
import csv
import sys
import folium
import pandas as pd

filename=sys.argv[1]
name=filename[:len(filename)-5:]
with open(filename, 'r') as f:
    data = json.load(f)


reviews = data['PROFILE_CONTAINER']['maps']['reviews']
output_data = []

for review in reviews:
    date = review['date']
    latitude = review['location']['position']['latitude']
    longitude = review['location']['position']['longitude']
    output_data.append((date, latitude, longitude))


op_file=name+".csv"
with open(op_file, 'w', newline='') as csvfile:
    csv_writer = csv.writer(csvfile)
    csv_writer.writerow(['date', 'latitude', 'longitude'])
    csv_writer.writerows(output_data)

df = pd.read_csv(op_file)
map = folium.Map(location=[df['latitude'].iloc[0], df['longitude'].iloc[0]], zoom_start=10)
for index, row in df.iterrows():
    folium.Marker(location=[row['latitude'], row['longitude']], popup=row['date']).add_to(map)
map_file=name+".html"
map.save(map_file)