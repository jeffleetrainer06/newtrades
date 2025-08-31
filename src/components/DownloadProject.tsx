export function DownloadProject() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Download Project Files</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">Complete Toyota Dealership System</h2>
        <p className="text-blue-800 mb-4">
          All project files are ready. This system includes vehicle management, photo uploads, and customer inquiries.
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4">System Features:</h3>
        <ul className="list-disc list-inside space-y-2 text-green-800">
          <li>Vehicle inventory management with search and filtering</li>
          <li>Photo upload system for salespeople (password: upload123)</li>
          <li>Customer inquiry forms with email notifications</li>
          <li>Admin dashboard for managing vehicles and inquiries</li>
          <li>Mobile-optimized design for all devices</li>
          <li>Integration with Supabase for data storage</li>
        </ul>
      </div>
    </div>
  )
}
