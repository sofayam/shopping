import React, { useState, useMemo } from 'react';
import { ListGroup, Button, Form, Dropdown, ButtonGroup } from 'react-bootstrap';

const ShoppingList = ({ list, allShops, onRemove, onToggle, onRemoveTicked, onArchive }) => {
  const [selectedShop, setSelectedShop] = useState('All Shops');

  const filteredAndGroupedList = useMemo(() => {
    if (selectedShop === 'All Shops') {
      // --- Optimization Algorithm to Minimize Shops ---
      const itemsToCover = new Set(list.map(item => item.listId));
      const fullItemList = list;

      // Create a map of which shops sell which items from the list
      const shopMap = {};
      fullItemList.forEach(item => {
        // USE THE NEW `availableShops` PROPERTY
        const itemShops = item.availableShops && item.availableShops.length > 0 ? item.availableShops : ['Any Shop'];
        itemShops.forEach(shop => {
          if (!shopMap[shop]) {
            shopMap[shop] = [];
          }
          shopMap[shop].push(item.listId);
        });
      });

      const optimizedPlan = {};
      while (itemsToCover.size > 0) {
        let bestShop = '';
        let maxCovered = 0;
        let itemsCoveredByBestShop = [];

        // Find the shop that covers the most REMAINING items
        for (const shop in shopMap) {
          const coveredItems = shopMap[shop].filter(itemId => itemsToCover.has(itemId));
          if (coveredItems.length > maxCovered) {
            maxCovered = coveredItems.length;
            bestShop = shop;
            itemsCoveredByBestShop = coveredItems;
          }
        }

        if (maxCovered === 0) break;

        const itemsForShop = fullItemList.filter(item => itemsCoveredByBestShop.includes(item.listId));
        optimizedPlan[bestShop] = itemsForShop;
        
        itemsCoveredByBestShop.forEach(itemId => itemsToCover.delete(itemId));
      }
      
      if (itemsToCover.size > 0) {
          optimizedPlan['Any Shop'] = fullItemList.filter(item => itemsToCover.has(item.listId));
      }

      // Group by type within each shop and sort
      for (const shop in optimizedPlan) {
        const byType = optimizedPlan[shop].reduce((acc, item) => {
          const typeKey = item.type || 'Uncategorized';
          if (!acc[typeKey]) acc[typeKey] = [];
          acc[typeKey].push(item);
          return acc;
        }, {});

        for (const type in byType) {
          byType[type].sort((a, b) => a.name.localeCompare(b.name));
        }
        optimizedPlan[shop] = byType;
      }
      
      return optimizedPlan;

    } else {
      // --- Logic for Filtering by a Single Shop ---
      // USE THE NEW `availableShops` PROPERTY
      const items = list.filter(item => item.availableShops && item.availableShops.includes(selectedShop));
      
      const grouped = items.reduce((acc, item) => {
        const groupKey = item.type || 'Uncategorized';
        if (!acc[groupKey]) {
          acc[groupKey] = [];
        }
        acc[groupKey].push(item);
        return acc;
      }, {});

      for (const type in grouped) {
        grouped[type].sort((a, b) => a.name.localeCompare(b.name));
      }
      return grouped;
    }
  }, [list, selectedShop]);

  const renderList = () => {
    const groups = Object.keys(filteredAndGroupedList).sort();
    if (groups.length === 0) return <p>Your shopping list is empty.</p>;

    return groups.map(groupName => (
        <div key={groupName} className="mb-4">
            <h4>{groupName}</h4>
            {selectedShop === 'All Shops' ? 
                Object.keys(filteredAndGroupedList[groupName]).sort().map(typeName => (
                    <div key={typeName} className="mb-3">
                        <h5>{typeName}</h5>
                        <ListGroup>
                        {filteredAndGroupedList[groupName][typeName].map(item => (
                            <ListGroup.Item key={item.listId} variant={item.ticked ? 'light' : ''} className="d-flex justify-content-between align-items-center">
                                <Form.Check
                                    type="checkbox"
                                    checked={item.ticked}
                                    onChange={() => onToggle(item.listId, !item.ticked)}
                                    label={item.name}
                                    className={item.ticked ? 'text-muted' : ''}
                                    style={{ textDecoration: item.ticked ? 'line-through' : 'none' }}
                                />
                                <Button variant="outline-danger" size="sm" onClick={() => onRemove(item.listId)}>Remove</Button>
                            </ListGroup.Item>
                        ))}
                        </ListGroup>
                    </div>
                ))
            :
                <ListGroup>
                {filteredAndGroupedList[groupName].map(item => (
                    <ListGroup.Item key={item.listId} variant={item.ticked ? 'light' : ''} className="d-flex justify-content-between align-items-center">
                        <Form.Check
                            type="checkbox"
                            checked={item.ticked}
                            onChange={() => onToggle(item.listId, !item.ticked)}
                            label={item.name}
                            className={item.ticked ? 'text-muted' : ''}
                            style={{ textDecoration: item.ticked ? 'line-through' : 'none' }}
                        />
                        <Button variant="outline-danger" size="sm" onClick={() => onRemove(item.listId)}>Remove</Button>
                    </ListGroup.Item>
                ))}
                </ListGroup>
            }
        </div>
    ));
  };


  return (
    <>
      <div className="d-flex justify-content-between mb-3">
        <Dropdown as={ButtonGroup}>
          <Dropdown.Toggle id="dropdown-shop-filter">
            Filter by Shop: {selectedShop}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {allShops.map(shop => (
              <Dropdown.Item key={shop} onClick={() => setSelectedShop(shop)}>
                {shop}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
        <ButtonGroup>
            <Button variant="warning" onClick={onRemoveTicked}>Remove Ticked</Button>
            <Button variant="danger" onClick={onArchive}>Archive List</Button>
        </ButtonGroup>
      </div>
      {renderList()}
    </>
  );
};

export default ShoppingList;
