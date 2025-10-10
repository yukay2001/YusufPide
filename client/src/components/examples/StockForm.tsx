import StockForm from '../StockForm'

export default function StockFormExample() {
  return (
    <StockForm 
      onSubmit={(data) => console.log('Stock added:', data)} 
    />
  )
}
