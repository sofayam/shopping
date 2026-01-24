# Data model for shopping PWA

## Item type (enum)
- dry goods, fresh veg, tools, fixtures etc


## Shop type (enum)
- supermarket, diy, clothes

## WhatIsWhere (mapping)
- mapping from item type to shop type

## Shop (record) 
- name
- shop type
- aisle order (list of item type in order of walking through aisles)

## Item (record)
- name
- item type
- preferred shop (optional)




# Application interfaces

## ItemList (list)
- list of names of item currently needed

## ListPage

A web page with the following functionality
- new list creates a new itemlist and a corresponding file individuated by date and time in file name
- add item
- delete item

## ShoppingPage 

A structured web page with following functionality:

- choose shop or shops to visit 
- create and display purchase list with appropriate (based on chosen shops) items from Itemlist organised by shop and then by aisle order within shop, taking account of preferred shop if several shops offer the same item.

for each purchase i can:
- tick off purchase
- defer purchase (remove from shoppinglist but not from Itemlist)

finally i can:
- purge ticked off items from Itemlist 
- change chosen shop(s) and recreate purchase list

## Management Interface
A set of pages for editing the data model and only allowing creation of valid entries.



# Implementation notes

All data, including model stored as yaml files which are validated when read in.

All data entry where possible powered by intelligent drop downs to minimise entry effort and eliminate invalid input.