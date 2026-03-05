export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-16">
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
