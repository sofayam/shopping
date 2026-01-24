# Data model for shopping PWA

## Item type (enum)
- dry goods, fresh veg, tools, fixtures etc


## Shop type (enum)
- supermarket, diy, clothes

## WhatIsWhere (mapping)
- Associates an item type with an ordered list of shop types. The order indicates preference, with the first being the most preferred.

## Shop (record) 
- name
- shop type
- aisle order (list of item type in order of walking through aisles)

## Item (record)
- name
- item type
- preferred shop (optional)

## Itemlist
- a list of names of items currently needed



