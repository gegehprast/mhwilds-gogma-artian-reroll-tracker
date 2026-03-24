export function ImportDropZone({
  onFile,
  parseError,
}: {
  onFile: (file: File) => void
  parseError: string | null
}) {
  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFile(file)
  }

  return (
    <label
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed border-gray-700 hover:border-gray-500 rounded-lg p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors text-gray-400 hover:text-gray-300"
    >
      <span className="text-3xl">📂</span>
      <p className="text-sm font-medium">
        Drop your JSON file here, or click to browse
      </p>
      <p className="text-xs text-gray-600">Only .json files are accepted</p>
      <input
        type="file"
        accept=".json,application/json"
        className="sr-only"
        onChange={handleChange}
      />
      {parseError && (
        <p className="text-xs text-red-400 bg-red-950/50 px-3 py-2 rounded border border-red-800 mt-2">
          {parseError}
        </p>
      )}
    </label>
  )
}
