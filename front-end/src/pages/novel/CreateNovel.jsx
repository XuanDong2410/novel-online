import { useState } from "react";
import axios from "axios";
import Navbar from "../../components/Navbar";
import WatchPageSkeleton from "../../components/skeletons/WatchPageSkeleton";

const CreateNovel = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await axios.post("/api/v1/novel/create", {
        title,
        description,
        author,
        genre: genre.split(",").map(g => g.trim()), // Chuyển genre thành mảng
      });

      if (response.data.success) {
        setSuccessMessage("Novel created successfully!");
        console.log(response);
      }
    } catch (err) {
      setError(err.response ? err.response.data.message : "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <WatchPageSkeleton />;
  return (
    <div className="bg-black min-h-screen text-white">
      <div className="mx-auto container px-2 h-full">
        <Navbar />
        <div className="flex justify-center items-center mt-10">
          <div className="w-full max-w-lg bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Create New Novel</h2>

            {successMessage && (
              <div className="bg-green-500 text-white p-2 rounded mb-4">
                {successMessage}
              </div>
            )}

            {error && (
              <div className="bg-red-500 text-white p-2 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-300">Title</label>
                <input
                  type="text"
                  id="title"
                  className="mt-2 p-2 w-full bg-gray-700 border border-gray-600 rounded"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description</label>
                <textarea
                  id="description"
                  className="mt-2 p-2 w-full bg-gray-700 border border-gray-600 rounded"
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="author" className="block text-sm font-medium text-gray-300">Author</label>
                <input
                  type="text"
                  id="author"
                  className="mt-2 p-2 w-full bg-gray-700 border border-gray-600 rounded"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="genre" className="block text-sm font-medium text-gray-300">Genre (comma-separated)</label>
                <input
                  type="text"
                  id="genre"
                  className="mt-2 p-2 w-full bg-gray-700 border border-gray-600 rounded"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Novel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateNovel;
