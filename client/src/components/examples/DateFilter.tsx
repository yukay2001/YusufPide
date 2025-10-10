import { useState } from 'react'
import DateFilter from '../DateFilter'

export default function DateFilterExample() {
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  return (
    <DateFilter 
      dateFrom={dateFrom}
      dateTo={dateTo}
      onDateFromChange={setDateFrom}
      onDateToChange={setDateTo}
      onClear={() => { setDateFrom(""); setDateTo(""); }}
      onExport={() => console.log('Export triggered')}
    />
  )
}
