import SalesForm from '../SalesForm'

export default function SalesFormExample() {
  return (
    <SalesForm 
      onSubmit={(data) => console.log('Sale submitted:', data)} 
    />
  )
}
