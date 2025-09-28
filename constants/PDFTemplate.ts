// PDF Template for Government Price Monitoring Documents
// This template shows the expected format for PDF parsing based on actual government documents

export const PDF_TEMPLATE = `
ANNEX 'A': Prevailing Retail Prices of Selected Agricultural and Fishery Commodities
in Selected Wet Markets in the National Capital Region for the Daily Price Index (PMPI)

Date of Monitoring: 29 August 2023 (Wednesday)

COMMODITY | SPECIFICATION | PREVAILING RETAIL PRICE PER UNIT (P/unit)

I. IMPORTED COMMERCIAL RICE
1. Fancy | White Rice | 32.15
2. Premium | 5% per strain | 45.25
3. Well Milled | 15% per strain | 46.75
4. Regular Milled | 25-50% back stock | 42.45

II. LOCAL COMMERCIAL RICE
5. Fancy | White Rice | 52.50
6. Premium | 5% per strain | 54.00
7. Well Milled | 15% per strain | 50.25
8. Regular Milled | 25-50% back stock | 38.36

III. CORN
9. Corn White | Cob, Dried/Fresh | 72.00
10. Corn Yellow | Cob, Dried/Fresh | 72.00
11. Corn Grits White | Food Grade | 55.00
12. Corn Grits Yellow | Food Grade | 55.00
13. Corn Grains Yellow | Food Grade | 20.00
14. Corn Grains Feed Grade | Feed Grade | 18.00

IV. FISH
15. Bangus | Large | 250.00
16. Tilapia | Medium | 155.00
17. Galunggong Local | Medium | 160.00
18. Galunggong Imported | Medium | 155.00
19. Alumahan | Medium | 230.00
20. Dalagang Bukid Local | Local | 210.00
21. Dalagang Bukid Imported | Imported | 210.00
22. Dilis Local | Local | 310.00
23. Dilis Imported | Imported | 420.00
24. Pusit Fresh | Fresh | 440.00
25. Squid Fresh/Frozen | Fresh/Frozen | 440.00

V. LIVESTOCK & POULTRY PRODUCTS
26. Carabeef Lean Meat | Boneless | 380.00
27. Carabeef Brisket | Boneless | 350.00
28. Beef Rump Imported | Boneless | 450.00
29. Beef Brisket Imported | Boneless | 420.00
30. Beef Sirloin Imported | Boneless | 520.00
31. Beef Tenderloin Imported | Boneless | 620.00

32. Pork Ham Local | Ham | 320.00
33. Pork Ham Imported | Ham | 300.00
34. Pork Loin Local | Loin | 320.00
35. Pork Loin Imported | Loin | 300.00
36. Pork Belly Local | Belly | 320.00
37. Pork Belly Imported | Belly | 300.00

38. Chicken Whole Local | Whole | 190.00
39. Chicken Whole Imported | Whole | 170.00
40. Chicken Breast Local | Breast | 210.00
41. Chicken Breast Imported | Breast | 190.00
42. Chicken Thigh Local | Thigh | 180.00
43. Chicken Thigh Imported | Thigh | 160.00
44. Chicken Wing Local | Wing | 120.00
45. Chicken Wing Imported | Wing | 100.00

46. Chicken Eggs Medium | Medium | 7.00
47. Chicken Eggs Large | Large | 8.00
48. Chicken Eggs Extra Large | Extra Large | 9.00

VI. PROCESSED MEAT PRODUCTS
49. Hotdog Regular | Regular | 150.00
50. Hotdog Jumbo | Jumbo | 180.00
51. Longganisa Local | Local | 200.00
52. Longganisa Imported | Imported | 180.00
53. Tocino Local | Local | 180.00
54. Tocino Imported | Imported | 160.00
55. Tapa Local | Local | 200.00
56. Tapa Imported | Imported | 180.00
57. Ham Local | Local | 220.00
58. Ham Imported | Imported | 200.00
59. Bacon Local | Local | 250.00
60. Bacon Imported | Imported | 230.00
61. Sausage Local | Local | 180.00
62. Sausage Imported | Imported | 160.00
63. Corned Beef Local | Local | 200.00
64. Corned Beef Imported | Imported | 180.00
65. Luncheon Meat Local | Local | 180.00
66. Luncheon Meat Imported | Imported | 160.00
67. Pork and Beans Local | Local | 80.00
68. Pork and Beans Imported | Imported | 70.00

VII. VEGETABLES
69. Ampalaya | Ampalaya | 100.00
70. Baguio Beans | Baguio Beans | 80.00
71. Squash | Squash | 60.00
72. Eggplant | Eggplant | 80.00
73. Tomato | Tomato | 100.00
74. Onion Red | Red | 80.00
75. Onion White | White | 70.00
76. Garlic | Garlic | 120.00
77. Ginger | Ginger | 100.00
78. Chili | Chili | 80.00

VIII. FRUITS
79. Apple Fuji | Fuji | 50.00
80. Apple Granny Smith | Granny Smith | 50.00
81. Banana Lakatan | Lakatan | 40.00
82. Banana Latundan | Latundan | 35.00
83. Banana Saba | Saba | 30.00
84. Mango Carabao | Carabao | 80.00
85. Mango Indian | Indian | 70.00
86. Mango Pico | Pico | 60.00
87. Papaya | Papaya | 40.00
88. Pineapple | Pineapple | 50.00
89. Watermelon | Watermelon | 60.00
90. Melon | Melon | 50.00
91. Pomelo | Pomelo | 80.00
92. Avocado | Avocado | 100.00

IX. OTHER BASIC COMMODITIES
93. Sugar Brown | Brown | 50.00
94. Sugar White | White | 60.00
95. Sugar Refined | Refined | 65.00
96. Sugar Washed | Washed | 55.00
97. Salt | Salt | 20.00
98. Cooking Oil Palm | Palm | 80.00
99. Cooking Oil Coconut | Coconut | 85.00
100. Cooking Oil Canola | Canola | 90.00
`;

// Empty template - shows structure without prices
export const EMPTY_TEMPLATE = `
ANNEX 'A': Prevailing Retail Prices of Selected Agricultural and Fishery Commodities
in Selected Wet Markets in the National Capital Region for the Daily Price Index (PMPI)

Date of Monitoring: {DATE}

COMMODITY | SPECIFICATION | PREVAILING RETAIL PRICE PER UNIT (P/unit)

I. IMPORTED COMMERCIAL RICE
1. Fancy | White Rice | 
2. Premium | 5% per strain | 
3. Well Milled | 15% per strain | 
4. Regular Milled | 25-50% back stock | 

II. LOCAL COMMERCIAL RICE
5. Fancy | White Rice | 
6. Premium | 5% per strain | 
7. Well Milled | 15% per strain | 
8. Regular Milled | 25-50% back stock | 

III. CORN
9. Corn White | Cob, Dried/Fresh | 
10. Corn Yellow | Cob, Dried/Fresh | 
11. Corn Grits White | Food Grade | 
12. Corn Grits Yellow | Food Grade | 
13. Corn Grains Yellow | Food Grade | 
14. Corn Grains Feed Grade | Feed Grade | 

IV. FISH
15. Bangus | Large | 
16. Tilapia | Medium | 
17. Galunggong Local | Medium | 
18. Galunggong Imported | Medium | 
19. Alumahan | Medium | 
20. Dalagang Bukid Local | Local | 
21. Dalagang Bukid Imported | Imported | 
22. Dilis Local | Local | 
23. Dilis Imported | Imported | 
24. Pusit Fresh | Fresh | 
25. Squid Fresh/Frozen | Fresh/Frozen | 

V. LIVESTOCK & POULTRY PRODUCTS
26. Carabeef Lean Meat | Boneless | 
27. Carabeef Brisket | Boneless | 
28. Beef Rump Imported | Boneless | 
29. Beef Brisket Imported | Boneless | 
30. Beef Sirloin Imported | Boneless | 
31. Beef Tenderloin Imported | Boneless | 

32. Pork Ham Local | Ham | 
33. Pork Ham Imported | Ham | 
34. Pork Loin Local | Loin | 
35. Pork Loin Imported | Loin | 
36. Pork Belly Local | Belly | 
37. Pork Belly Imported | Belly | 

38. Chicken Whole Local | Whole | 
39. Chicken Whole Imported | Whole | 
40. Chicken Breast Local | Breast | 
41. Chicken Breast Imported | Breast | 
42. Chicken Thigh Local | Thigh | 
43. Chicken Thigh Imported | Thigh | 
44. Chicken Wing Local | Wing | 
45. Chicken Wing Imported | Wing | 

46. Chicken Eggs Medium | Medium | 
47. Chicken Eggs Large | Large | 
48. Chicken Eggs Extra Large | Extra Large | 

VI. PROCESSED MEAT PRODUCTS
49. Hotdog Regular | Regular | 
50. Hotdog Jumbo | Jumbo | 
51. Longganisa Local | Local | 
52. Longganisa Imported | Imported | 
53. Tocino Local | Local | 
54. Tocino Imported | Imported | 
55. Tapa Local | Local | 
56. Tapa Imported | Imported | 
57. Ham Local | Local | 
58. Ham Imported | Imported | 
59. Bacon Local | Local | 
60. Bacon Imported | Imported | 
61. Sausage Local | Local | 
62. Sausage Imported | Imported | 
63. Corned Beef Local | Local | 
64. Corned Beef Imported | Imported | 
65. Luncheon Meat Local | Local | 
66. Luncheon Meat Imported | Imported | 
67. Pork and Beans Local | Local | 
68. Pork and Beans Imported | Imported | 

VII. VEGETABLES
69. Ampalaya | Ampalaya | 
70. Baguio Beans | Baguio Beans | 
71. Squash | Squash | 
72. Eggplant | Eggplant | 
73. Tomato | Tomato | 
74. Onion Red | Red | 
75. Onion White | White | 
76. Garlic | Garlic | 
77. Ginger | Ginger | 
78. Chili | Chili | 

VIII. FRUITS
79. Apple Fuji | Fuji | 
80. Apple Granny Smith | Granny Smith | 
81. Banana Lakatan | Lakatan | 
82. Banana Latundan | Latundan | 
83. Banana Saba | Saba | 
84. Mango Carabao | Carabao | 
85. Mango Indian | Indian | 
86. Mango Pico | Pico | 
87. Papaya | Papaya | 
88. Pineapple | Pineapple | 
89. Watermelon | Watermelon | 
90. Melon | Melon | 
91. Pomelo | Pomelo | 
92. Avocado | Avocado | 

IX. OTHER BASIC COMMODITIES
93. Sugar Brown | Brown | 
94. Sugar White | White | 
95. Sugar Refined | Refined | 
96. Sugar Washed | Washed | 
97. Salt | Salt | 
98. Cooking Oil Palm | Palm | 
99. Cooking Oil Coconut | Coconut | 
100. Cooking Oil Canola | Canola | 
`;

// Enhanced product mapping for better matching with actual PDF format
export const PRODUCT_MAPPING = {
  // Rice products - exact matches from PDF
  'Rice Fancy (Imported)': ['1. Fancy', 'Fancy'],
  'Rice Premium (Imported)': ['2. Premium', 'Premium'],
  'Rice Well Milled (Imported)': ['3. Well Milled', 'Well Milled'],
  'Rice Regular Milled (Imported)': ['4. Regular Milled', 'Regular Milled'],
  
  'Rice Fancy (Local)': ['5. Fancy', 'Fancy'],
  'Rice Premium (Local)': ['6. Premium', 'Premium'],
  'Rice Well Milled (Local)': ['7. Well Milled', 'Well Milled'],
  'Rice Regular Milled (Local)': ['8. Regular Milled', 'Regular Milled'],
  
  // Corn products
  'Corn White': ['9. Corn White', 'Corn White'],
  'Corn Yellow': ['10. Corn Yellow', 'Corn Yellow'],
  'Corn Grits White': ['11. Corn Grits White', 'Corn Grits White'],
  'Corn Grits Yellow': ['12. Corn Grits Yellow', 'Corn Grits Yellow'],
  'Corn Grains Yellow': ['13. Corn Grains Yellow', 'Corn Grains Yellow'],
  'Corn Grains Feed Grade': ['14. Corn Grains Feed Grade', 'Corn Grains Feed Grade'],
  
  // Fish products
  'Bangus': ['15. Bangus', 'Bangus'],
  'Tilapia': ['16. Tilapia', 'Tilapia'],
  'Galunggong Local': ['17. Galunggong Local', 'Galunggong Local'],
  'Galunggong Imported': ['18. Galunggong Imported', 'Galunggong Imported'],
  'Alumahan': ['19. Alumahan', 'Alumahan'],
  'Dalagang Bukid Local': ['20. Dalagang Bukid Local', 'Dalagang Bukid Local'],
  'Dalagang Bukid Imported': ['21. Dalagang Bukid Imported', 'Dalang Bukid Imported'],
  'Dilis Local': ['22. Dilis Local', 'Dilis Local'],
  'Dilis Imported': ['23. Dilis Imported', 'Dilis Imported'],
  'Pusit Fresh': ['24. Pusit Fresh', 'Pusit Fresh'],
  'Squid Fresh/Frozen': ['25. Squid Fresh/Frozen', 'Squid Fresh/Frozen'],
  
  // Livestock products - updated to match actual PDF
  'Carabeef Lean Meat': ['26. Carabeef Lean Meat', 'Carabeef Lean Meat'],
  'Carabeef Brisket': ['27. Carabeef Brisket', 'Carabeef Brisket'],
  'Beef Rump Imported': ['28. Beef Rump Imported', 'Beef Rump Imported'],
  'Beef Brisket Imported': ['29. Beef Brisket Imported', 'Beef Brisket Imported'],
  'Beef Sirloin Imported': ['30. Beef Sirloin Imported', 'Beef Sirloin Imported'],
  'Beef Tenderloin Imported': ['31. Beef Tenderloin Imported', 'Beef Tenderloin Imported'],
  
  // Pork products
  'Pork Ham Local': ['32. Pork Ham Local', 'Pork Ham Local'],
  'Pork Ham Imported': ['33. Pork Ham Imported', 'Pork Ham Imported'],
  'Pork Loin Local': ['34. Pork Loin Local', 'Pork Loin Local'],
  'Pork Loin Imported': ['35. Pork Loin Imported', 'Pork Loin Imported'],
  'Pork Belly Local': ['36. Pork Belly Local', 'Pork Belly Local'],
  'Pork Belly Imported': ['37. Pork Belly Imported', 'Pork Belly Imported'],
  
  // Chicken products
  'Chicken Whole Local': ['38. Chicken Whole Local', 'Chicken Whole Local'],
  'Chicken Whole Imported': ['39. Chicken Whole Imported', 'Chicken Whole Imported'],
  'Chicken Breast Local': ['40. Chicken Breast Local', 'Chicken Breast Local'],
  'Chicken Breast Imported': ['41. Chicken Breast Imported', 'Chicken Breast Imported'],
  'Chicken Thigh Local': ['42. Chicken Thigh Local', 'Chicken Thigh Local'],
  'Chicken Thigh Imported': ['43. Chicken Thigh Imported', 'Chicken Thigh Imported'],
  'Chicken Wing Local': ['44. Chicken Wing Local', 'Chicken Wing Local'],
  'Chicken Wing Imported': ['45. Chicken Wing Imported', 'Chicken Wing Imported'],
  
  // Egg products
  'Chicken Eggs Medium': ['46. Chicken Eggs Medium', 'Chicken Eggs Medium'],
  'Chicken Eggs Large': ['47. Chicken Eggs Large', 'Chicken Eggs Large'],
  'Chicken Eggs Extra Large': ['48. Chicken Eggs Extra Large', 'Chicken Eggs Extra Large'],
  
  // Processed meat products
  'Hotdog Regular': ['49. Hotdog Regular', 'Hotdog Regular'],
  'Hotdog Jumbo': ['50. Hotdog Jumbo', 'Hotdog Jumbo'],
  'Longganisa Local': ['51. Longganisa Local', 'Longganisa Local'],
  'Longganisa Imported': ['52. Longganisa Imported', 'Longganisa Imported'],
  'Tocino Local': ['53. Tocino Local', 'Tocino Local'],
  'Tocino Imported': ['54. Tocino Imported', 'Tocino Imported'],
  'Tapa Local': ['55. Tapa Local', 'Tapa Local'],
  'Tapa Imported': ['56. Tapa Imported', 'Tapa Imported'],
  'Ham Local': ['57. Ham Local', 'Ham Local'],
  'Ham Imported': ['58. Ham Imported', 'Ham Imported'],
  'Bacon Local': ['59. Bacon Local', 'Bacon Local'],
  'Bacon Imported': ['60. Bacon Imported', 'Bacon Imported'],
  'Sausage Local': ['61. Sausage Local', 'Sausage Local'],
  'Sausage Imported': ['62. Sausage Imported', 'Sausage Imported'],
  'Corned Beef Local': ['63. Corned Beef Local', 'Corned Beef Local'],
  'Corned Beef Imported': ['64. Corned Beef Imported', 'Corned Beef Imported'],
  'Luncheon Meat Local': ['65. Luncheon Meat Local', 'Luncheon Meat Local'],
  'Luncheon Meat Imported': ['66. Luncheon Meat Imported', 'Luncheon Meat Imported'],
  'Pork and Beans Local': ['67. Pork and Beans Local', 'Pork and Beans Local'],
  'Pork and Beans Imported': ['68. Pork and Beans Imported', 'Pork and Beans Imported'],
  
  // Vegetables
  'Ampalaya': ['69. Ampalaya', 'Ampalaya'],
  'Baguio Beans': ['70. Baguio Beans', 'Baguio Beans'],
  'Squash': ['71. Squash', 'Squash'],
  'Eggplant': ['72. Eggplant', 'Eggplant'],
  'Tomato': ['73. Tomato', 'Tomato'],
  'Onion Red': ['74. Onion Red', 'Onion Red'],
  'Onion White': ['75. Onion White', 'Onion White'],
  'Garlic': ['76. Garlic', 'Garlic'],
  'Ginger': ['77. Ginger', 'Ginger'],
  'Chili': ['78. Chili', 'Chili'],
  
  // Fruits
  'Apple Fuji': ['79. Apple Fuji', 'Apple Fuji'],
  'Apple Granny Smith': ['80. Apple Granny Smith', 'Apple Granny Smith'],
  'Banana Lakatan': ['81. Banana Lakatan', 'Banana Lakatan'],
  'Banana Latundan': ['82. Banana Latundan', 'Banana Latundan'],
  'Banana Saba': ['83. Banana Saba', 'Banana Saba'],
  'Mango Carabao': ['84. Mango Carabao', 'Mango Carabao'],
  'Mango Indian': ['85. Mango Indian', 'Mango Indian'],
  'Mango Pico': ['86. Mango Pico', 'Mango Pico'],
  'Papaya': ['87. Papaya', 'Papaya'],
  'Pineapple': ['88. Pineapple', 'Pineapple'],
  'Watermelon': ['89. Watermelon', 'Watermelon'],
  'Melon': ['90. Melon', 'Melon'],
  'Pomelo': ['91. Pomelo', 'Pomelo'],
  'Avocado': ['92. Avocado', 'Avocado'],
  
  // Basic commodities
  'Sugar Brown': ['93. Sugar Brown', 'Sugar Brown'],
  'Sugar White': ['94. Sugar White', 'Sugar White'],
  'Sugar Refined': ['95. Sugar Refined', 'Sugar Refined'],
  'Sugar Washed': ['96. Sugar Washed', 'Sugar Washed'],
  'Salt Fine': ['97. Salt', 'Salt'],
  'Salt Coarse': ['97. Salt', 'Salt'],
  'Cooking Oil Palm': ['98. Cooking Oil Palm', 'Cooking Oil Palm'],
  'Cooking Oil Coconut': ['99. Cooking Oil Coconut', 'Cooking Oil Coconut'],
  'Cooking Oil Canola': ['100. Cooking Oil Canola', 'Cooking Oil Canola'],
};
