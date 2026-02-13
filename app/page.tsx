import { Header } from "@/components/header";

export default function Home() {
  return (
    <div>
      <Header />

      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <h1 className="text-4xl font-bold">Welcome to the Dashboard</h1>
        <p className="text-xl text-gray-600">
          Manage your rooms and reports here.
        </p>
      </div>
    </div>
  );
}
