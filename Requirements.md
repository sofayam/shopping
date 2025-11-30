
I want a React PWA (no offline use envisaged) to help me with shopping.

It will have three main functions

1) Managing the catalog of purchaseable items
- the catalog should be stored on the server as a json file
- each item has the following features
 - a canonical name
 - one or more nicknames
 - an item type (e.g. veg, dairy, household, ..
- i want to be able to define new items with as many names as i see fit, and also define new item types (without a separate screen for defining types)


2) Creating the current (there is only ever one) shopping list
 - also a json file on the server
 - add item to list
   - use a autocomplete over the catalog, using the name or any of the nicknames of the item,  to reduce necessary input 
 - delete item from list


3) Supporting the shopping process
 - display shopping list
 - set status of item (for ticking off the items while i am shopping)