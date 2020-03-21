# Script to generate doge-like ascii levels from images

# https://github.com/FienSoP/canny_edge_detector
from canny_edge_detector import cannyEdgeDetector
from utils.utils import load_data
from utils.utils import visualize

# https://github.com/RameshAditya/asciify
from asciify import do
from PIL import Image 
import numpy as np

img = load_data("imgs")

ced = cannyEdgeDetector(img, sigma=1, kernel_size=5, weak_pixel=75, strong_pixel=255, lowthreshold=0.05, highthreshold=0.15)

imgs = ced.detect()

# visualize(imgs)

j = 1
for i in imgs: 
    f = open('level' + str(j) + '.txt','w')
    f.write( do(Image.fromarray(i)) )
    f.close()
    j = j + 1


# convert from array to image
# img_obj = Image.fromarray(imgs[3])
# imgtxt = do(img_obj)
# print(imgtxt)

# convert tabs to spaces

# save as test map
# f = open('level.txt','w')
# f.write(imgtxt)
# f.close()

# img_obj = Image.fromarray(imgs[1])
# print(do(img_obj))


