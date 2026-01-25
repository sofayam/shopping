# Data model for shopping PWA

## Item type (enum)
- dry goods, fresh veg, tools, fixtures etc


## Shop type (enum)
- supermarket, diy, clothes

## ShopTypeToItemTypes (mapping)
- Associates a shop type with a list of item types that it typically sells. This defines the compatibility between shop types and item types.

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



