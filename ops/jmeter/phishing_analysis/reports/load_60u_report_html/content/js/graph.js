/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
$(document).ready(function() {

    $(".click-title").mouseenter( function(    e){
        e.preventDefault();
        this.style.cursor="pointer";
    });
    $(".click-title").mousedown( function(event){
        event.preventDefault();
    });

    // Ugly code while this script is shared among several pages
    try{
        refreshHitsPerSecond(true);
    } catch(e){}
    try{
        refreshResponseTimeOverTime(true);
    } catch(e){}
    try{
        refreshResponseTimePercentiles();
    } catch(e){}
});


var responseTimePercentilesInfos = {
        data: {"result": {"minY": 8.0, "minX": 0.0, "maxY": 407.0, "series": [{"data": [[0.0, 8.0], [0.1, 9.0], [0.2, 9.0], [0.3, 9.0], [0.4, 9.0], [0.5, 9.0], [0.6, 10.0], [0.7, 10.0], [0.8, 10.0], [0.9, 10.0], [1.0, 10.0], [1.1, 10.0], [1.2, 10.0], [1.3, 10.0], [1.4, 10.0], [1.5, 10.0], [1.6, 10.0], [1.7, 10.0], [1.8, 11.0], [1.9, 11.0], [2.0, 11.0], [2.1, 11.0], [2.2, 11.0], [2.3, 11.0], [2.4, 11.0], [2.5, 11.0], [2.6, 11.0], [2.7, 11.0], [2.8, 12.0], [2.9, 12.0], [3.0, 12.0], [3.1, 12.0], [3.2, 12.0], [3.3, 12.0], [3.4, 12.0], [3.5, 12.0], [3.6, 12.0], [3.7, 13.0], [3.8, 13.0], [3.9, 13.0], [4.0, 13.0], [4.1, 13.0], [4.2, 13.0], [4.3, 13.0], [4.4, 13.0], [4.5, 13.0], [4.6, 13.0], [4.7, 13.0], [4.8, 14.0], [4.9, 14.0], [5.0, 14.0], [5.1, 14.0], [5.2, 14.0], [5.3, 14.0], [5.4, 14.0], [5.5, 15.0], [5.6, 15.0], [5.7, 15.0], [5.8, 15.0], [5.9, 15.0], [6.0, 15.0], [6.1, 16.0], [6.2, 16.0], [6.3, 16.0], [6.4, 16.0], [6.5, 16.0], [6.6, 16.0], [6.7, 16.0], [6.8, 17.0], [6.9, 17.0], [7.0, 17.0], [7.1, 17.0], [7.2, 17.0], [7.3, 17.0], [7.4, 18.0], [7.5, 18.0], [7.6, 18.0], [7.7, 19.0], [7.8, 19.0], [7.9, 19.0], [8.0, 20.0], [8.1, 20.0], [8.2, 20.0], [8.3, 21.0], [8.4, 21.0], [8.5, 21.0], [8.6, 22.0], [8.7, 22.0], [8.8, 22.0], [8.9, 22.0], [9.0, 23.0], [9.1, 23.0], [9.2, 23.0], [9.3, 23.0], [9.4, 23.0], [9.5, 23.0], [9.6, 23.0], [9.7, 23.0], [9.8, 23.0], [9.9, 23.0], [10.0, 23.0], [10.1, 24.0], [10.2, 24.0], [10.3, 24.0], [10.4, 24.0], [10.5, 24.0], [10.6, 24.0], [10.7, 25.0], [10.8, 25.0], [10.9, 25.0], [11.0, 25.0], [11.1, 25.0], [11.2, 25.0], [11.3, 25.0], [11.4, 26.0], [11.5, 26.0], [11.6, 26.0], [11.7, 26.0], [11.8, 27.0], [11.9, 27.0], [12.0, 27.0], [12.1, 27.0], [12.2, 27.0], [12.3, 28.0], [12.4, 28.0], [12.5, 28.0], [12.6, 28.0], [12.7, 28.0], [12.8, 28.0], [12.9, 29.0], [13.0, 29.0], [13.1, 29.0], [13.2, 29.0], [13.3, 29.0], [13.4, 29.0], [13.5, 29.0], [13.6, 29.0], [13.7, 30.0], [13.8, 30.0], [13.9, 30.0], [14.0, 31.0], [14.1, 31.0], [14.2, 31.0], [14.3, 31.0], [14.4, 31.0], [14.5, 31.0], [14.6, 31.0], [14.7, 32.0], [14.8, 32.0], [14.9, 32.0], [15.0, 33.0], [15.1, 34.0], [15.2, 35.0], [15.3, 35.0], [15.4, 36.0], [15.5, 36.0], [15.6, 37.0], [15.7, 37.0], [15.8, 37.0], [15.9, 37.0], [16.0, 38.0], [16.1, 38.0], [16.2, 38.0], [16.3, 38.0], [16.4, 38.0], [16.5, 38.0], [16.6, 38.0], [16.7, 38.0], [16.8, 38.0], [16.9, 39.0], [17.0, 39.0], [17.1, 39.0], [17.2, 39.0], [17.3, 39.0], [17.4, 39.0], [17.5, 39.0], [17.6, 39.0], [17.7, 40.0], [17.8, 40.0], [17.9, 40.0], [18.0, 40.0], [18.1, 40.0], [18.2, 41.0], [18.3, 41.0], [18.4, 41.0], [18.5, 41.0], [18.6, 42.0], [18.7, 42.0], [18.8, 42.0], [18.9, 42.0], [19.0, 43.0], [19.1, 43.0], [19.2, 44.0], [19.3, 44.0], [19.4, 45.0], [19.5, 45.0], [19.6, 45.0], [19.7, 45.0], [19.8, 45.0], [19.9, 45.0], [20.0, 45.0], [20.1, 46.0], [20.2, 46.0], [20.3, 46.0], [20.4, 46.0], [20.5, 46.0], [20.6, 46.0], [20.7, 46.0], [20.8, 47.0], [20.9, 47.0], [21.0, 47.0], [21.1, 47.0], [21.2, 48.0], [21.3, 48.0], [21.4, 48.0], [21.5, 49.0], [21.6, 49.0], [21.7, 50.0], [21.8, 50.0], [21.9, 50.0], [22.0, 51.0], [22.1, 51.0], [22.2, 51.0], [22.3, 51.0], [22.4, 51.0], [22.5, 51.0], [22.6, 52.0], [22.7, 52.0], [22.8, 52.0], [22.9, 53.0], [23.0, 53.0], [23.1, 53.0], [23.2, 53.0], [23.3, 53.0], [23.4, 53.0], [23.5, 53.0], [23.6, 54.0], [23.7, 54.0], [23.8, 54.0], [23.9, 54.0], [24.0, 54.0], [24.1, 54.0], [24.2, 54.0], [24.3, 54.0], [24.4, 54.0], [24.5, 54.0], [24.6, 54.0], [24.7, 55.0], [24.8, 55.0], [24.9, 55.0], [25.0, 55.0], [25.1, 56.0], [25.2, 56.0], [25.3, 56.0], [25.4, 56.0], [25.5, 56.0], [25.6, 57.0], [25.7, 57.0], [25.8, 57.0], [25.9, 57.0], [26.0, 57.0], [26.1, 57.0], [26.2, 57.0], [26.3, 57.0], [26.4, 58.0], [26.5, 58.0], [26.6, 58.0], [26.7, 58.0], [26.8, 58.0], [26.9, 58.0], [27.0, 58.0], [27.1, 58.0], [27.2, 58.0], [27.3, 59.0], [27.4, 59.0], [27.5, 59.0], [27.6, 59.0], [27.7, 59.0], [27.8, 60.0], [27.9, 60.0], [28.0, 60.0], [28.1, 60.0], [28.2, 60.0], [28.3, 60.0], [28.4, 60.0], [28.5, 61.0], [28.6, 61.0], [28.7, 61.0], [28.8, 61.0], [28.9, 61.0], [29.0, 62.0], [29.1, 62.0], [29.2, 62.0], [29.3, 62.0], [29.4, 62.0], [29.5, 63.0], [29.6, 63.0], [29.7, 63.0], [29.8, 63.0], [29.9, 63.0], [30.0, 64.0], [30.1, 64.0], [30.2, 64.0], [30.3, 64.0], [30.4, 64.0], [30.5, 65.0], [30.6, 65.0], [30.7, 65.0], [30.8, 65.0], [30.9, 65.0], [31.0, 65.0], [31.1, 66.0], [31.2, 66.0], [31.3, 66.0], [31.4, 66.0], [31.5, 67.0], [31.6, 67.0], [31.7, 67.0], [31.8, 67.0], [31.9, 67.0], [32.0, 68.0], [32.1, 68.0], [32.2, 68.0], [32.3, 68.0], [32.4, 68.0], [32.5, 68.0], [32.6, 68.0], [32.7, 68.0], [32.8, 68.0], [32.9, 69.0], [33.0, 69.0], [33.1, 69.0], [33.2, 69.0], [33.3, 69.0], [33.4, 69.0], [33.5, 70.0], [33.6, 70.0], [33.7, 70.0], [33.8, 70.0], [33.9, 70.0], [34.0, 70.0], [34.1, 70.0], [34.2, 70.0], [34.3, 70.0], [34.4, 71.0], [34.5, 71.0], [34.6, 71.0], [34.7, 71.0], [34.8, 71.0], [34.9, 71.0], [35.0, 72.0], [35.1, 72.0], [35.2, 72.0], [35.3, 72.0], [35.4, 72.0], [35.5, 73.0], [35.6, 73.0], [35.7, 73.0], [35.8, 73.0], [35.9, 73.0], [36.0, 73.0], [36.1, 74.0], [36.2, 74.0], [36.3, 74.0], [36.4, 74.0], [36.5, 75.0], [36.6, 75.0], [36.7, 75.0], [36.8, 75.0], [36.9, 75.0], [37.0, 75.0], [37.1, 75.0], [37.2, 76.0], [37.3, 76.0], [37.4, 76.0], [37.5, 76.0], [37.6, 76.0], [37.7, 76.0], [37.8, 76.0], [37.9, 77.0], [38.0, 77.0], [38.1, 77.0], [38.2, 77.0], [38.3, 77.0], [38.4, 78.0], [38.5, 78.0], [38.6, 78.0], [38.7, 78.0], [38.8, 78.0], [38.9, 79.0], [39.0, 79.0], [39.1, 79.0], [39.2, 79.0], [39.3, 79.0], [39.4, 80.0], [39.5, 80.0], [39.6, 80.0], [39.7, 80.0], [39.8, 80.0], [39.9, 80.0], [40.0, 81.0], [40.1, 81.0], [40.2, 81.0], [40.3, 81.0], [40.4, 81.0], [40.5, 81.0], [40.6, 81.0], [40.7, 81.0], [40.8, 82.0], [40.9, 82.0], [41.0, 82.0], [41.1, 82.0], [41.2, 83.0], [41.3, 83.0], [41.4, 83.0], [41.5, 83.0], [41.6, 83.0], [41.7, 83.0], [41.8, 84.0], [41.9, 84.0], [42.0, 84.0], [42.1, 84.0], [42.2, 84.0], [42.3, 84.0], [42.4, 84.0], [42.5, 84.0], [42.6, 84.0], [42.7, 84.0], [42.8, 84.0], [42.9, 85.0], [43.0, 85.0], [43.1, 85.0], [43.2, 85.0], [43.3, 85.0], [43.4, 85.0], [43.5, 86.0], [43.6, 86.0], [43.7, 86.0], [43.8, 86.0], [43.9, 86.0], [44.0, 86.0], [44.1, 86.0], [44.2, 87.0], [44.3, 87.0], [44.4, 87.0], [44.5, 88.0], [44.6, 88.0], [44.7, 88.0], [44.8, 88.0], [44.9, 89.0], [45.0, 89.0], [45.1, 89.0], [45.2, 89.0], [45.3, 89.0], [45.4, 89.0], [45.5, 89.0], [45.6, 90.0], [45.7, 90.0], [45.8, 90.0], [45.9, 90.0], [46.0, 90.0], [46.1, 91.0], [46.2, 91.0], [46.3, 92.0], [46.4, 92.0], [46.5, 92.0], [46.6, 92.0], [46.7, 92.0], [46.8, 92.0], [46.9, 93.0], [47.0, 93.0], [47.1, 93.0], [47.2, 93.0], [47.3, 93.0], [47.4, 93.0], [47.5, 93.0], [47.6, 94.0], [47.7, 94.0], [47.8, 94.0], [47.9, 95.0], [48.0, 95.0], [48.1, 95.0], [48.2, 95.0], [48.3, 95.0], [48.4, 96.0], [48.5, 96.0], [48.6, 96.0], [48.7, 96.0], [48.8, 97.0], [48.9, 97.0], [49.0, 97.0], [49.1, 97.0], [49.2, 97.0], [49.3, 97.0], [49.4, 98.0], [49.5, 98.0], [49.6, 98.0], [49.7, 98.0], [49.8, 98.0], [49.9, 98.0], [50.0, 99.0], [50.1, 99.0], [50.2, 99.0], [50.3, 99.0], [50.4, 99.0], [50.5, 99.0], [50.6, 99.0], [50.7, 99.0], [50.8, 100.0], [50.9, 100.0], [51.0, 100.0], [51.1, 100.0], [51.2, 100.0], [51.3, 100.0], [51.4, 101.0], [51.5, 101.0], [51.6, 101.0], [51.7, 101.0], [51.8, 101.0], [51.9, 101.0], [52.0, 101.0], [52.1, 101.0], [52.2, 102.0], [52.3, 102.0], [52.4, 102.0], [52.5, 102.0], [52.6, 102.0], [52.7, 102.0], [52.8, 102.0], [52.9, 102.0], [53.0, 103.0], [53.1, 103.0], [53.2, 103.0], [53.3, 103.0], [53.4, 103.0], [53.5, 103.0], [53.6, 103.0], [53.7, 104.0], [53.8, 104.0], [53.9, 104.0], [54.0, 104.0], [54.1, 104.0], [54.2, 104.0], [54.3, 104.0], [54.4, 104.0], [54.5, 105.0], [54.6, 105.0], [54.7, 105.0], [54.8, 105.0], [54.9, 105.0], [55.0, 105.0], [55.1, 106.0], [55.2, 106.0], [55.3, 106.0], [55.4, 106.0], [55.5, 106.0], [55.6, 106.0], [55.7, 107.0], [55.8, 107.0], [55.9, 107.0], [56.0, 107.0], [56.1, 107.0], [56.2, 107.0], [56.3, 107.0], [56.4, 107.0], [56.5, 108.0], [56.6, 108.0], [56.7, 108.0], [56.8, 108.0], [56.9, 109.0], [57.0, 109.0], [57.1, 109.0], [57.2, 109.0], [57.3, 110.0], [57.4, 110.0], [57.5, 110.0], [57.6, 110.0], [57.7, 110.0], [57.8, 111.0], [57.9, 111.0], [58.0, 111.0], [58.1, 111.0], [58.2, 111.0], [58.3, 111.0], [58.4, 112.0], [58.5, 112.0], [58.6, 112.0], [58.7, 112.0], [58.8, 112.0], [58.9, 113.0], [59.0, 113.0], [59.1, 113.0], [59.2, 113.0], [59.3, 113.0], [59.4, 113.0], [59.5, 113.0], [59.6, 114.0], [59.7, 114.0], [59.8, 114.0], [59.9, 114.0], [60.0, 114.0], [60.1, 114.0], [60.2, 115.0], [60.3, 115.0], [60.4, 115.0], [60.5, 115.0], [60.6, 115.0], [60.7, 116.0], [60.8, 116.0], [60.9, 116.0], [61.0, 116.0], [61.1, 116.0], [61.2, 116.0], [61.3, 116.0], [61.4, 116.0], [61.5, 117.0], [61.6, 117.0], [61.7, 117.0], [61.8, 117.0], [61.9, 118.0], [62.0, 118.0], [62.1, 118.0], [62.2, 118.0], [62.3, 118.0], [62.4, 118.0], [62.5, 119.0], [62.6, 119.0], [62.7, 119.0], [62.8, 119.0], [62.9, 120.0], [63.0, 120.0], [63.1, 120.0], [63.2, 120.0], [63.3, 120.0], [63.4, 120.0], [63.5, 120.0], [63.6, 121.0], [63.7, 121.0], [63.8, 121.0], [63.9, 121.0], [64.0, 121.0], [64.1, 121.0], [64.2, 121.0], [64.3, 122.0], [64.4, 122.0], [64.5, 122.0], [64.6, 122.0], [64.7, 122.0], [64.8, 122.0], [64.9, 122.0], [65.0, 123.0], [65.1, 123.0], [65.2, 123.0], [65.3, 123.0], [65.4, 123.0], [65.5, 123.0], [65.6, 123.0], [65.7, 123.0], [65.8, 124.0], [65.9, 124.0], [66.0, 124.0], [66.1, 124.0], [66.2, 124.0], [66.3, 124.0], [66.4, 125.0], [66.5, 125.0], [66.6, 125.0], [66.7, 125.0], [66.8, 125.0], [66.9, 126.0], [67.0, 126.0], [67.1, 126.0], [67.2, 126.0], [67.3, 126.0], [67.4, 126.0], [67.5, 126.0], [67.6, 127.0], [67.7, 127.0], [67.8, 127.0], [67.9, 127.0], [68.0, 127.0], [68.1, 127.0], [68.2, 128.0], [68.3, 128.0], [68.4, 128.0], [68.5, 128.0], [68.6, 128.0], [68.7, 128.0], [68.8, 128.0], [68.9, 128.0], [69.0, 129.0], [69.1, 129.0], [69.2, 129.0], [69.3, 129.0], [69.4, 129.0], [69.5, 129.0], [69.6, 129.0], [69.7, 129.0], [69.8, 129.0], [69.9, 130.0], [70.0, 130.0], [70.1, 130.0], [70.2, 130.0], [70.3, 130.0], [70.4, 130.0], [70.5, 131.0], [70.6, 131.0], [70.7, 131.0], [70.8, 131.0], [70.9, 131.0], [71.0, 131.0], [71.1, 131.0], [71.2, 132.0], [71.3, 132.0], [71.4, 132.0], [71.5, 132.0], [71.6, 132.0], [71.7, 132.0], [71.8, 132.0], [71.9, 132.0], [72.0, 132.0], [72.1, 133.0], [72.2, 133.0], [72.3, 133.0], [72.4, 133.0], [72.5, 133.0], [72.6, 133.0], [72.7, 134.0], [72.8, 134.0], [72.9, 134.0], [73.0, 134.0], [73.1, 134.0], [73.2, 135.0], [73.3, 135.0], [73.4, 135.0], [73.5, 135.0], [73.6, 136.0], [73.7, 136.0], [73.8, 136.0], [73.9, 136.0], [74.0, 136.0], [74.1, 137.0], [74.2, 137.0], [74.3, 137.0], [74.4, 137.0], [74.5, 138.0], [74.6, 138.0], [74.7, 138.0], [74.8, 138.0], [74.9, 139.0], [75.0, 139.0], [75.1, 139.0], [75.2, 139.0], [75.3, 139.0], [75.4, 140.0], [75.5, 140.0], [75.6, 140.0], [75.7, 140.0], [75.8, 141.0], [75.9, 141.0], [76.0, 141.0], [76.1, 141.0], [76.2, 141.0], [76.3, 141.0], [76.4, 141.0], [76.5, 142.0], [76.6, 142.0], [76.7, 142.0], [76.8, 143.0], [76.9, 143.0], [77.0, 143.0], [77.1, 143.0], [77.2, 144.0], [77.3, 144.0], [77.4, 144.0], [77.5, 144.0], [77.6, 144.0], [77.7, 144.0], [77.8, 144.0], [77.9, 145.0], [78.0, 145.0], [78.1, 145.0], [78.2, 145.0], [78.3, 146.0], [78.4, 146.0], [78.5, 146.0], [78.6, 146.0], [78.7, 146.0], [78.8, 147.0], [78.9, 147.0], [79.0, 147.0], [79.1, 147.0], [79.2, 147.0], [79.3, 147.0], [79.4, 147.0], [79.5, 148.0], [79.6, 148.0], [79.7, 148.0], [79.8, 148.0], [79.9, 148.0], [80.0, 149.0], [80.1, 149.0], [80.2, 149.0], [80.3, 149.0], [80.4, 150.0], [80.5, 150.0], [80.6, 150.0], [80.7, 151.0], [80.8, 151.0], [80.9, 151.0], [81.0, 151.0], [81.1, 152.0], [81.2, 152.0], [81.3, 153.0], [81.4, 153.0], [81.5, 154.0], [81.6, 154.0], [81.7, 154.0], [81.8, 155.0], [81.9, 155.0], [82.0, 156.0], [82.1, 156.0], [82.2, 157.0], [82.3, 157.0], [82.4, 157.0], [82.5, 157.0], [82.6, 158.0], [82.7, 159.0], [82.8, 159.0], [82.9, 159.0], [83.0, 159.0], [83.1, 160.0], [83.2, 160.0], [83.3, 161.0], [83.4, 161.0], [83.5, 162.0], [83.6, 162.0], [83.7, 162.0], [83.8, 163.0], [83.9, 163.0], [84.0, 164.0], [84.1, 164.0], [84.2, 165.0], [84.3, 165.0], [84.4, 165.0], [84.5, 166.0], [84.6, 166.0], [84.7, 166.0], [84.8, 167.0], [84.9, 167.0], [85.0, 167.0], [85.1, 169.0], [85.2, 169.0], [85.3, 170.0], [85.4, 170.0], [85.5, 171.0], [85.6, 171.0], [85.7, 172.0], [85.8, 172.0], [85.9, 173.0], [86.0, 173.0], [86.1, 174.0], [86.2, 174.0], [86.3, 175.0], [86.4, 175.0], [86.5, 176.0], [86.6, 177.0], [86.7, 178.0], [86.8, 180.0], [86.9, 181.0], [87.0, 183.0], [87.1, 184.0], [87.2, 184.0], [87.3, 185.0], [87.4, 187.0], [87.5, 188.0], [87.6, 189.0], [87.7, 190.0], [87.8, 191.0], [87.9, 193.0], [88.0, 194.0], [88.1, 195.0], [88.2, 196.0], [88.3, 199.0], [88.4, 201.0], [88.5, 203.0], [88.6, 204.0], [88.7, 204.0], [88.8, 206.0], [88.9, 207.0], [89.0, 209.0], [89.1, 211.0], [89.2, 212.0], [89.3, 215.0], [89.4, 216.0], [89.5, 219.0], [89.6, 219.0], [89.7, 221.0], [89.8, 223.0], [89.9, 224.0], [90.0, 228.0], [90.1, 230.0], [90.2, 234.0], [90.3, 234.0], [90.4, 235.0], [90.5, 237.0], [90.6, 239.0], [90.7, 242.0], [90.8, 242.0], [90.9, 243.0], [91.0, 244.0], [91.1, 245.0], [91.2, 246.0], [91.3, 248.0], [91.4, 249.0], [91.5, 251.0], [91.6, 252.0], [91.7, 255.0], [91.8, 256.0], [91.9, 258.0], [92.0, 259.0], [92.1, 260.0], [92.2, 262.0], [92.3, 263.0], [92.4, 264.0], [92.5, 264.0], [92.6, 265.0], [92.7, 267.0], [92.8, 267.0], [92.9, 269.0], [93.0, 272.0], [93.1, 273.0], [93.2, 274.0], [93.3, 276.0], [93.4, 279.0], [93.5, 279.0], [93.6, 280.0], [93.7, 280.0], [93.8, 281.0], [93.9, 281.0], [94.0, 283.0], [94.1, 283.0], [94.2, 283.0], [94.3, 284.0], [94.4, 285.0], [94.5, 286.0], [94.6, 287.0], [94.7, 289.0], [94.8, 289.0], [94.9, 290.0], [95.0, 290.0], [95.1, 291.0], [95.2, 291.0], [95.3, 292.0], [95.4, 293.0], [95.5, 294.0], [95.6, 294.0], [95.7, 295.0], [95.8, 297.0], [95.9, 297.0], [96.0, 298.0], [96.1, 299.0], [96.2, 300.0], [96.3, 301.0], [96.4, 302.0], [96.5, 304.0], [96.6, 305.0], [96.7, 306.0], [96.8, 307.0], [96.9, 308.0], [97.0, 309.0], [97.1, 309.0], [97.2, 310.0], [97.3, 310.0], [97.4, 311.0], [97.5, 312.0], [97.6, 313.0], [97.7, 314.0], [97.8, 318.0], [97.9, 322.0], [98.0, 323.0], [98.1, 323.0], [98.2, 325.0], [98.3, 326.0], [98.4, 327.0], [98.5, 328.0], [98.6, 329.0], [98.7, 330.0], [98.8, 335.0], [98.9, 337.0], [99.0, 339.0], [99.1, 341.0], [99.2, 342.0], [99.3, 344.0], [99.4, 347.0], [99.5, 351.0], [99.6, 356.0], [99.7, 358.0], [99.8, 368.0], [99.9, 384.0]], "isOverall": false, "label": "POST /api/v1/chat/analyze-email", "isController": false}], "supportsControllersDiscrimination": true, "maxX": 100.0, "title": "Response Time Percentiles"}},
        getOptions: function() {
            return {
                series: {
                    points: { show: false }
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimePercentiles'
                },
                xaxis: {
                    tickDecimals: 1,
                    axisLabel: "Percentiles",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Percentile value in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : %x.2 percentile was %y ms"
                },
                selection: { mode: "xy" },
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesResponseTimePercentiles"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimesPercentiles"), dataset, options);
            // setup overview
            $.plot($("#overviewResponseTimesPercentiles"), dataset, prepareOverviewOptions(options));
        }
};

/**
 * @param elementId Id of element where we display message
 */
function setEmptyGraph(elementId) {
    $(function() {
        $(elementId).text("No graph series with filter="+seriesFilter);
    });
}

// Response times percentiles
function refreshResponseTimePercentiles() {
    var infos = responseTimePercentilesInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyResponseTimePercentiles");
        return;
    }
    if (isGraph($("#flotResponseTimesPercentiles"))){
        infos.createGraph();
    } else {
        var choiceContainer = $("#choicesResponseTimePercentiles");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimesPercentiles", "#overviewResponseTimesPercentiles");
        $('#bodyResponseTimePercentiles .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
}

var responseTimeDistributionInfos = {
        data: {"result": {"minY": 2.0, "minX": 0.0, "maxY": 2460.0, "series": [{"data": [[0.0, 2460.0], [300.0, 183.0], [200.0, 380.0], [100.0, 1823.0], [400.0, 2.0]], "isOverall": false, "label": "POST /api/v1/chat/analyze-email", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 100, "maxX": 400.0, "title": "Response Time Distribution"}},
        getOptions: function() {
            var granularity = this.data.result.granularity;
            return {
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimeDistribution'
                },
                xaxis:{
                    axisLabel: "Response times in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of responses",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                bars : {
                    show: true,
                    barWidth: this.data.result.granularity
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: function(label, xval, yval, flotItem){
                        return yval + " responses for " + label + " were between " + xval + " and " + (xval + granularity) + " ms";
                    }
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimeDistribution"), prepareData(data.result.series, $("#choicesResponseTimeDistribution")), options);
        }

};

// Response time distribution
function refreshResponseTimeDistribution() {
    var infos = responseTimeDistributionInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyResponseTimeDistribution");
        return;
    }
    if (isGraph($("#flotResponseTimeDistribution"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesResponseTimeDistribution");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        $('#footerResponseTimeDistribution .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};


var syntheticResponseTimeDistributionInfos = {
        data: {"result": {"minY": 4848.0, "minX": 0.0, "ticks": [[0, "Requests having \nresponse time <= 500ms"], [1, "Requests having \nresponse time > 500ms and <= 1,500ms"], [2, "Requests having \nresponse time > 1,500ms"], [3, "Requests in error"]], "maxY": 4848.0, "series": [{"data": [[0.0, 4848.0]], "color": "#9ACD32", "isOverall": false, "label": "Requests having \nresponse time <= 500ms", "isController": false}, {"data": [], "color": "yellow", "isOverall": false, "label": "Requests having \nresponse time > 500ms and <= 1,500ms", "isController": false}, {"data": [], "color": "orange", "isOverall": false, "label": "Requests having \nresponse time > 1,500ms", "isController": false}, {"data": [], "color": "#FF6347", "isOverall": false, "label": "Requests in error", "isController": false}], "supportsControllersDiscrimination": false, "maxX": 4.9E-324, "title": "Synthetic Response Times Distribution"}},
        getOptions: function() {
            return {
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendSyntheticResponseTimeDistribution'
                },
                xaxis:{
                    axisLabel: "Response times ranges",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                    tickLength:0,
                    min:-0.5,
                    max:3.5
                },
                yaxis: {
                    axisLabel: "Number of responses",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                bars : {
                    show: true,
                    align: "center",
                    barWidth: 0.25,
                    fill:.75
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: function(label, xval, yval, flotItem){
                        return yval + " " + label;
                    }
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var options = this.getOptions();
            prepareOptions(options, data);
            options.xaxis.ticks = data.result.ticks;
            $.plot($("#flotSyntheticResponseTimeDistribution"), prepareData(data.result.series, $("#choicesSyntheticResponseTimeDistribution")), options);
        }

};

// Response time distribution
function refreshSyntheticResponseTimeDistribution() {
    var infos = syntheticResponseTimeDistributionInfos;
    prepareSeries(infos.data, true);
    if (isGraph($("#flotSyntheticResponseTimeDistribution"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesSyntheticResponseTimeDistribution");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        $('#footerSyntheticResponseTimeDistribution .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var activeThreadsOverTimeInfos = {
        data: {"result": {"minY": 55.29393564356449, "minX": 1.7950635E12, "maxY": 55.29393564356449, "series": [{"data": [[1.7950635E12, 55.29393564356449]], "isOverall": false, "label": "Usuarios Virtuales Concurrentes", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.7950635E12, "title": "Active Threads Over Time"}},
        getOptions: function() {
            return {
                series: {
                    stack: true,
                    lines: {
                        show: true,
                        fill: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of active threads",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 6,
                    show: true,
                    container: '#legendActiveThreadsOverTime'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                selection: {
                    mode: 'xy'
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : At %x there were %y active threads"
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesActiveThreadsOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotActiveThreadsOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewActiveThreadsOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Active Threads Over Time
function refreshActiveThreadsOverTime(fixTimestamps) {
    var infos = activeThreadsOverTimeInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -18000000);
    }
    if(isGraph($("#flotActiveThreadsOverTime"))) {
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesActiveThreadsOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotActiveThreadsOverTime", "#overviewActiveThreadsOverTime");
        $('#footerActiveThreadsOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var timeVsThreadsInfos = {
        data: {"result": {"minY": 9.888888888888891, "minX": 4.0, "maxY": 193.61111111111111, "series": [{"data": [[4.0, 25.5], [5.0, 79.42857142857143], [6.0, 16.4], [7.0, 10.2], [8.0, 52.85714285714286], [9.0, 12.5], [10.0, 25.833333333333336], [11.0, 10.125], [12.0, 9.888888888888891], [13.0, 11.0], [14.0, 54.214285714285715], [15.0, 10.1], [16.0, 14.818181818181818], [17.0, 11.230769230769232], [18.0, 16.6], [19.0, 11.5625], [20.0, 12.615384615384617], [21.0, 45.47619047619048], [22.0, 20.61904761904762], [23.0, 12.722222222222221], [24.0, 28.866666666666667], [25.0, 18.1], [26.0, 13.5], [27.0, 11.764705882352942], [28.0, 17.1], [29.0, 15.904761904761905], [30.0, 16.76923076923077], [31.0, 25.346153846153847], [32.0, 46.80952380952381], [33.0, 23.080000000000002], [34.0, 27.315789473684212], [35.0, 21.2], [36.0, 22.961538461538463], [37.0, 34.25], [39.0, 63.0], [38.0, 70.0], [40.0, 193.61111111111111], [41.0, 177.04], [42.0, 40.652173913043484], [43.0, 68.11538461538461], [44.0, 30.32], [45.0, 25.73076923076923], [46.0, 45.88], [47.0, 35.199999999999996], [48.0, 41.17391304347826], [49.0, 57.59375], [50.0, 39.04761904761904], [51.0, 65.90476190476191], [52.0, 89.81481481481482], [53.0, 46.61764705882354], [54.0, 45.13333333333333], [55.0, 81.05555555555554], [56.0, 81.30555555555556], [57.0, 78.6], [58.0, 67.04761904761907], [59.0, 79.77272727272727], [60.0, 126.33627858627834]], "isOverall": false, "label": "POST /api/v1/chat/analyze-email", "isController": false}, {"data": [[55.29393564356449, 109.76423267326743]], "isOverall": false, "label": "POST /api/v1/chat/analyze-email-Aggregated", "isController": false}], "supportsControllersDiscrimination": true, "maxX": 60.0, "title": "Time VS Threads"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    axisLabel: "Number of active threads",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average response times in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: { noColumns: 2,show: true, container: '#legendTimeVsThreads' },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s: At %x.2 active threads, Average response time was %y.2 ms"
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesTimeVsThreads"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotTimesVsThreads"), dataset, options);
            // setup overview
            $.plot($("#overviewTimesVsThreads"), dataset, prepareOverviewOptions(options));
        }
};

// Time vs threads
function refreshTimeVsThreads(){
    var infos = timeVsThreadsInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyTimeVsThreads");
        return;
    }
    if(isGraph($("#flotTimesVsThreads"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesTimeVsThreads");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotTimesVsThreads", "#overviewTimesVsThreads");
        $('#footerTimeVsThreads .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var bytesThroughputOverTimeInfos = {
        data : {"result": {"minY": 91829.25, "minX": 1.7950635E12, "maxY": 118933.13333333333, "series": [{"data": [[1.7950635E12, 118933.13333333333]], "isOverall": false, "label": "Bytes received per second", "isController": false}, {"data": [[1.7950635E12, 91829.25]], "isOverall": false, "label": "Bytes sent per second", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.7950635E12, "title": "Bytes Throughput Over Time"}},
        getOptions : function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity) ,
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Bytes / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendBytesThroughputOverTime'
                },
                selection: {
                    mode: "xy"
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y"
                }
            };
        },
        createGraph : function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesBytesThroughputOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotBytesThroughputOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewBytesThroughputOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Bytes throughput Over Time
function refreshBytesThroughputOverTime(fixTimestamps) {
    var infos = bytesThroughputOverTimeInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -18000000);
    }
    if(isGraph($("#flotBytesThroughputOverTime"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesBytesThroughputOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotBytesThroughputOverTime", "#overviewBytesThroughputOverTime");
        $('#footerBytesThroughputOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
}

var responseTimesOverTimeInfos = {
        data: {"result": {"minY": 109.76423267326743, "minX": 1.7950635E12, "maxY": 109.76423267326743, "series": [{"data": [[1.7950635E12, 109.76423267326743]], "isOverall": false, "label": "POST /api/v1/chat/analyze-email", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.7950635E12, "title": "Response Time Over Time"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average response time in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimesOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Average response time was %y ms"
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesResponseTimesOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimesOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewResponseTimesOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Response Times Over Time
function refreshResponseTimeOverTime(fixTimestamps) {
    var infos = responseTimesOverTimeInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyResponseTimeOverTime");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -18000000);
    }
    if(isGraph($("#flotResponseTimesOverTime"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesResponseTimesOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimesOverTime", "#overviewResponseTimesOverTime");
        $('#footerResponseTimesOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var latenciesOverTimeInfos = {
        data: {"result": {"minY": 109.74917491749177, "minX": 1.7950635E12, "maxY": 109.74917491749177, "series": [{"data": [[1.7950635E12, 109.74917491749177]], "isOverall": false, "label": "POST /api/v1/chat/analyze-email", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.7950635E12, "title": "Latencies Over Time"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average response latencies in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendLatenciesOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Average latency was %y ms"
                }
            };
        },
        createGraph: function () {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesLatenciesOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotLatenciesOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewLatenciesOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Latencies Over Time
function refreshLatenciesOverTime(fixTimestamps) {
    var infos = latenciesOverTimeInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyLatenciesOverTime");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -18000000);
    }
    if(isGraph($("#flotLatenciesOverTime"))) {
        infos.createGraph();
    }else {
        var choiceContainer = $("#choicesLatenciesOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotLatenciesOverTime", "#overviewLatenciesOverTime");
        $('#footerLatenciesOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var connectTimeOverTimeInfos = {
        data: {"result": {"minY": 0.021864686468647015, "minX": 1.7950635E12, "maxY": 0.021864686468647015, "series": [{"data": [[1.7950635E12, 0.021864686468647015]], "isOverall": false, "label": "POST /api/v1/chat/analyze-email", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.7950635E12, "title": "Connect Time Over Time"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getConnectTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average Connect Time in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendConnectTimeOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Average connect time was %y ms"
                }
            };
        },
        createGraph: function () {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesConnectTimeOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotConnectTimeOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewConnectTimeOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Connect Time Over Time
function refreshConnectTimeOverTime(fixTimestamps) {
    var infos = connectTimeOverTimeInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyConnectTimeOverTime");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -18000000);
    }
    if(isGraph($("#flotConnectTimeOverTime"))) {
        infos.createGraph();
    }else {
        var choiceContainer = $("#choicesConnectTimeOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotConnectTimeOverTime", "#overviewConnectTimeOverTime");
        $('#footerConnectTimeOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var responseTimePercentilesOverTimeInfos = {
        data: {"result": {"minY": 8.0, "minX": 1.7950635E12, "maxY": 407.0, "series": [{"data": [[1.7950635E12, 407.0]], "isOverall": false, "label": "Max", "isController": false}, {"data": [[1.7950635E12, 8.0]], "isOverall": false, "label": "Min", "isController": false}, {"data": [[1.7950635E12, 228.10000000000036]], "isOverall": false, "label": "90th percentile", "isController": false}, {"data": [[1.7950635E12, 339.0]], "isOverall": false, "label": "99th percentile", "isController": false}, {"data": [[1.7950635E12, 99.0]], "isOverall": false, "label": "Median", "isController": false}, {"data": [[1.7950635E12, 290.0]], "isOverall": false, "label": "95th percentile", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.7950635E12, "title": "Response Time Percentiles Over Time (successful requests only)"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true,
                        fill: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Response Time in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimePercentilesOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Response time was %y ms"
                }
            };
        },
        createGraph: function () {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesResponseTimePercentilesOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimePercentilesOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewResponseTimePercentilesOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Response Time Percentiles Over Time
function refreshResponseTimePercentilesOverTime(fixTimestamps) {
    var infos = responseTimePercentilesOverTimeInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -18000000);
    }
    if(isGraph($("#flotResponseTimePercentilesOverTime"))) {
        infos.createGraph();
    }else {
        var choiceContainer = $("#choicesResponseTimePercentilesOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimePercentilesOverTime", "#overviewResponseTimePercentilesOverTime");
        $('#footerResponseTimePercentilesOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};


var responseTimeVsRequestInfos = {
    data: {"result": {"minY": 11.0, "minX": 20.0, "maxY": 132.0, "series": [{"data": [[134.0, 112.5], [209.0, 14.0], [226.0, 27.5], [231.0, 120.0], [234.0, 127.0], [247.0, 92.0], [242.0, 121.5], [241.0, 108.0], [258.0, 132.0], [261.0, 102.0], [264.0, 103.5], [287.0, 54.0], [278.0, 126.0], [277.0, 94.0], [294.0, 103.0], [301.0, 101.0], [20.0, 11.0], [120.0, 11.0]], "isOverall": false, "label": "Successes", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 1000, "maxX": 301.0, "title": "Response Time Vs Request"}},
    getOptions: function() {
        return {
            series: {
                lines: {
                    show: false
                },
                points: {
                    show: true
                }
            },
            xaxis: {
                axisLabel: "Global number of requests per second",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            yaxis: {
                axisLabel: "Median Response Time in ms",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            legend: {
                noColumns: 2,
                show: true,
                container: '#legendResponseTimeVsRequest'
            },
            selection: {
                mode: 'xy'
            },
            grid: {
                hoverable: true // IMPORTANT! this is needed for tooltip to work
            },
            tooltip: true,
            tooltipOpts: {
                content: "%s : Median response time at %x req/s was %y ms"
            },
            colors: ["#9ACD32", "#FF6347"]
        };
    },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesResponseTimeVsRequest"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotResponseTimeVsRequest"), dataset, options);
        // setup overview
        $.plot($("#overviewResponseTimeVsRequest"), dataset, prepareOverviewOptions(options));

    }
};

// Response Time vs Request
function refreshResponseTimeVsRequest() {
    var infos = responseTimeVsRequestInfos;
    prepareSeries(infos.data);
    if (isGraph($("#flotResponseTimeVsRequest"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesResponseTimeVsRequest");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimeVsRequest", "#overviewResponseTimeVsRequest");
        $('#footerResponseRimeVsRequest .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};


var latenciesVsRequestInfos = {
    data: {"result": {"minY": 11.0, "minX": 20.0, "maxY": 132.0, "series": [{"data": [[134.0, 112.5], [209.0, 14.0], [226.0, 27.5], [231.0, 120.0], [234.0, 127.0], [247.0, 92.0], [242.0, 121.5], [241.0, 108.0], [258.0, 132.0], [261.0, 102.0], [264.0, 103.5], [287.0, 54.0], [278.0, 126.0], [277.0, 94.0], [294.0, 103.0], [301.0, 101.0], [20.0, 11.0], [120.0, 11.0]], "isOverall": false, "label": "Successes", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 1000, "maxX": 301.0, "title": "Latencies Vs Request"}},
    getOptions: function() {
        return{
            series: {
                lines: {
                    show: false
                },
                points: {
                    show: true
                }
            },
            xaxis: {
                axisLabel: "Global number of requests per second",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            yaxis: {
                axisLabel: "Median Latency in ms",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            legend: { noColumns: 2,show: true, container: '#legendLatencyVsRequest' },
            selection: {
                mode: 'xy'
            },
            grid: {
                hoverable: true // IMPORTANT! this is needed for tooltip to work
            },
            tooltip: true,
            tooltipOpts: {
                content: "%s : Median Latency time at %x req/s was %y ms"
            },
            colors: ["#9ACD32", "#FF6347"]
        };
    },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesLatencyVsRequest"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotLatenciesVsRequest"), dataset, options);
        // setup overview
        $.plot($("#overviewLatenciesVsRequest"), dataset, prepareOverviewOptions(options));
    }
};

// Latencies vs Request
function refreshLatenciesVsRequest() {
        var infos = latenciesVsRequestInfos;
        prepareSeries(infos.data);
        if(isGraph($("#flotLatenciesVsRequest"))){
            infos.createGraph();
        }else{
            var choiceContainer = $("#choicesLatencyVsRequest");
            createLegend(choiceContainer, infos);
            infos.createGraph();
            setGraphZoomable("#flotLatenciesVsRequest", "#overviewLatenciesVsRequest");
            $('#footerLatenciesVsRequest .legendColorBox > div').each(function(i){
                $(this).clone().prependTo(choiceContainer.find("li").eq(i));
            });
        }
};

var hitsPerSecondInfos = {
        data: {"result": {"minY": 80.8, "minX": 1.7950635E12, "maxY": 80.8, "series": [{"data": [[1.7950635E12, 80.8]], "isOverall": false, "label": "hitsPerSecond", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.7950635E12, "title": "Hits Per Second"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of hits / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendHitsPerSecond"
                },
                selection: {
                    mode : 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y.2 hits/sec"
                }
            };
        },
        createGraph: function createGraph() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesHitsPerSecond"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotHitsPerSecond"), dataset, options);
            // setup overview
            $.plot($("#overviewHitsPerSecond"), dataset, prepareOverviewOptions(options));
        }
};

// Hits per second
function refreshHitsPerSecond(fixTimestamps) {
    var infos = hitsPerSecondInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -18000000);
    }
    if (isGraph($("#flotHitsPerSecond"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesHitsPerSecond");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotHitsPerSecond", "#overviewHitsPerSecond");
        $('#footerHitsPerSecond .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
}

var codesPerSecondInfos = {
        data: {"result": {"minY": 80.8, "minX": 1.7950635E12, "maxY": 80.8, "series": [{"data": [[1.7950635E12, 80.8]], "isOverall": false, "label": "200", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.7950635E12, "title": "Codes Per Second"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of responses / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendCodesPerSecond"
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "Number of Response Codes %s at %x was %y.2 responses / sec"
                }
            };
        },
    createGraph: function() {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesCodesPerSecond"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotCodesPerSecond"), dataset, options);
        // setup overview
        $.plot($("#overviewCodesPerSecond"), dataset, prepareOverviewOptions(options));
    }
};

// Codes per second
function refreshCodesPerSecond(fixTimestamps) {
    var infos = codesPerSecondInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -18000000);
    }
    if(isGraph($("#flotCodesPerSecond"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesCodesPerSecond");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotCodesPerSecond", "#overviewCodesPerSecond");
        $('#footerCodesPerSecond .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var transactionsPerSecondInfos = {
        data: {"result": {"minY": 80.8, "minX": 1.7950635E12, "maxY": 80.8, "series": [{"data": [[1.7950635E12, 80.8]], "isOverall": false, "label": "POST /api/v1/chat/analyze-email-success", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.7950635E12, "title": "Transactions Per Second"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of transactions / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendTransactionsPerSecond"
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y transactions / sec"
                }
            };
        },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesTransactionsPerSecond"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotTransactionsPerSecond"), dataset, options);
        // setup overview
        $.plot($("#overviewTransactionsPerSecond"), dataset, prepareOverviewOptions(options));
    }
};

// Transactions per second
function refreshTransactionsPerSecond(fixTimestamps) {
    var infos = transactionsPerSecondInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyTransactionsPerSecond");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -18000000);
    }
    if(isGraph($("#flotTransactionsPerSecond"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesTransactionsPerSecond");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotTransactionsPerSecond", "#overviewTransactionsPerSecond");
        $('#footerTransactionsPerSecond .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var totalTPSInfos = {
        data: {"result": {"minY": 80.8, "minX": 1.7950635E12, "maxY": 80.8, "series": [{"data": [[1.7950635E12, 80.8]], "isOverall": false, "label": "Transaction-success", "isController": false}, {"data": [], "isOverall": false, "label": "Transaction-failure", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.7950635E12, "title": "Total Transactions Per Second"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of transactions / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendTotalTPS"
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y transactions / sec"
                },
                colors: ["#9ACD32", "#FF6347"]
            };
        },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesTotalTPS"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotTotalTPS"), dataset, options);
        // setup overview
        $.plot($("#overviewTotalTPS"), dataset, prepareOverviewOptions(options));
    }
};

// Total Transactions per second
function refreshTotalTPS(fixTimestamps) {
    var infos = totalTPSInfos;
    // We want to ignore seriesFilter
    prepareSeries(infos.data, false, true);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -18000000);
    }
    if(isGraph($("#flotTotalTPS"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesTotalTPS");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotTotalTPS", "#overviewTotalTPS");
        $('#footerTotalTPS .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

// Collapse the graph matching the specified DOM element depending the collapsed
// status
function collapse(elem, collapsed){
    if(collapsed){
        $(elem).parent().find(".fa-chevron-up").removeClass("fa-chevron-up").addClass("fa-chevron-down");
    } else {
        $(elem).parent().find(".fa-chevron-down").removeClass("fa-chevron-down").addClass("fa-chevron-up");
        if (elem.id == "bodyBytesThroughputOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshBytesThroughputOverTime(true);
            }
            document.location.href="#bytesThroughputOverTime";
        } else if (elem.id == "bodyLatenciesOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshLatenciesOverTime(true);
            }
            document.location.href="#latenciesOverTime";
        } else if (elem.id == "bodyCustomGraph") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshCustomGraph(true);
            }
            document.location.href="#responseCustomGraph";
        } else if (elem.id == "bodyConnectTimeOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshConnectTimeOverTime(true);
            }
            document.location.href="#connectTimeOverTime";
        } else if (elem.id == "bodyResponseTimePercentilesOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshResponseTimePercentilesOverTime(true);
            }
            document.location.href="#responseTimePercentilesOverTime";
        } else if (elem.id == "bodyResponseTimeDistribution") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshResponseTimeDistribution();
            }
            document.location.href="#responseTimeDistribution" ;
        } else if (elem.id == "bodySyntheticResponseTimeDistribution") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshSyntheticResponseTimeDistribution();
            }
            document.location.href="#syntheticResponseTimeDistribution" ;
        } else if (elem.id == "bodyActiveThreadsOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshActiveThreadsOverTime(true);
            }
            document.location.href="#activeThreadsOverTime";
        } else if (elem.id == "bodyTimeVsThreads") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshTimeVsThreads();
            }
            document.location.href="#timeVsThreads" ;
        } else if (elem.id == "bodyCodesPerSecond") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshCodesPerSecond(true);
            }
            document.location.href="#codesPerSecond";
        } else if (elem.id == "bodyTransactionsPerSecond") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshTransactionsPerSecond(true);
            }
            document.location.href="#transactionsPerSecond";
        } else if (elem.id == "bodyTotalTPS") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshTotalTPS(true);
            }
            document.location.href="#totalTPS";
        } else if (elem.id == "bodyResponseTimeVsRequest") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshResponseTimeVsRequest();
            }
            document.location.href="#responseTimeVsRequest";
        } else if (elem.id == "bodyLatenciesVsRequest") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshLatenciesVsRequest();
            }
            document.location.href="#latencyVsRequest";
        }
    }
}

/*
 * Activates or deactivates all series of the specified graph (represented by id parameter)
 * depending on checked argument.
 */
function toggleAll(id, checked){
    var placeholder = document.getElementById(id);

    var cases = $(placeholder).find(':checkbox');
    cases.prop('checked', checked);
    $(cases).parent().children().children().toggleClass("legend-disabled", !checked);

    var choiceContainer;
    if ( id == "choicesBytesThroughputOverTime"){
        choiceContainer = $("#choicesBytesThroughputOverTime");
        refreshBytesThroughputOverTime(false);
    } else if(id == "choicesResponseTimesOverTime"){
        choiceContainer = $("#choicesResponseTimesOverTime");
        refreshResponseTimeOverTime(false);
    }else if(id == "choicesResponseCustomGraph"){
        choiceContainer = $("#choicesResponseCustomGraph");
        refreshCustomGraph(false);
    } else if ( id == "choicesLatenciesOverTime"){
        choiceContainer = $("#choicesLatenciesOverTime");
        refreshLatenciesOverTime(false);
    } else if ( id == "choicesConnectTimeOverTime"){
        choiceContainer = $("#choicesConnectTimeOverTime");
        refreshConnectTimeOverTime(false);
    } else if ( id == "choicesResponseTimePercentilesOverTime"){
        choiceContainer = $("#choicesResponseTimePercentilesOverTime");
        refreshResponseTimePercentilesOverTime(false);
    } else if ( id == "choicesResponseTimePercentiles"){
        choiceContainer = $("#choicesResponseTimePercentiles");
        refreshResponseTimePercentiles();
    } else if(id == "choicesActiveThreadsOverTime"){
        choiceContainer = $("#choicesActiveThreadsOverTime");
        refreshActiveThreadsOverTime(false);
    } else if ( id == "choicesTimeVsThreads"){
        choiceContainer = $("#choicesTimeVsThreads");
        refreshTimeVsThreads();
    } else if ( id == "choicesSyntheticResponseTimeDistribution"){
        choiceContainer = $("#choicesSyntheticResponseTimeDistribution");
        refreshSyntheticResponseTimeDistribution();
    } else if ( id == "choicesResponseTimeDistribution"){
        choiceContainer = $("#choicesResponseTimeDistribution");
        refreshResponseTimeDistribution();
    } else if ( id == "choicesHitsPerSecond"){
        choiceContainer = $("#choicesHitsPerSecond");
        refreshHitsPerSecond(false);
    } else if(id == "choicesCodesPerSecond"){
        choiceContainer = $("#choicesCodesPerSecond");
        refreshCodesPerSecond(false);
    } else if ( id == "choicesTransactionsPerSecond"){
        choiceContainer = $("#choicesTransactionsPerSecond");
        refreshTransactionsPerSecond(false);
    } else if ( id == "choicesTotalTPS"){
        choiceContainer = $("#choicesTotalTPS");
        refreshTotalTPS(false);
    } else if ( id == "choicesResponseTimeVsRequest"){
        choiceContainer = $("#choicesResponseTimeVsRequest");
        refreshResponseTimeVsRequest();
    } else if ( id == "choicesLatencyVsRequest"){
        choiceContainer = $("#choicesLatencyVsRequest");
        refreshLatenciesVsRequest();
    }
    var color = checked ? "black" : "#818181";
    if(choiceContainer != null) {
        choiceContainer.find("label").each(function(){
            this.style.color = color;
        });
    }
}

