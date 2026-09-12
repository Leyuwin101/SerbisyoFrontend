import { Link } from 'react-router-dom'

export function NotFoundPage(): React.ReactElement {
  return (
    <div className="py-20 text-center">
      <h1 className="text-4xl font-bold text-slate-800">404</h1>
      <p className="mt-2 text-slate-600">The page you were looking for does not exist.</p>
      <Link to="/" className="mt-4 inline-block font-medium text-indigo-600 hover:underline">
        Go home
      </Link>
    </div>
  )
}
