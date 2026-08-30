import MinibarForm from '../components/minibar/MinibarForm'
import MinibarList from '../components/minibar/MinibarList'

export default function MinibarPage({ products, onAddProduct, onUpdateProduct }) {
  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
      <MinibarForm onAddProduct={onAddProduct} />
      <MinibarList products={products} onUpdateProduct={onUpdateProduct} />
    </div>
  )
}
