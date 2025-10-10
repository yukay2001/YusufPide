import StockAlert from '../StockAlert'

export default function StockAlertExample() {
  const items = [
    { name: "Kıymalı", quantity: 3 },
    { name: "Peynirli", quantity: 2 },
    { name: "Un", quantity: 1 },
  ];

  return <StockAlert items={items} />
}
