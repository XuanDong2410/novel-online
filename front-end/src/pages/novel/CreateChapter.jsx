import { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import WatchPageSkeleton from "../../components/skeletons/WatchPageSkeleton";

const CreateChapter = () => {
  //const { novelId } = useParams(); // Lấy novelId từ URL
  //const history = useHistory(); // Để điều hướng sau khi tạo chương thành công
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [novelId, setNovelId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await axios.post("/api/chapter/create", {
        title,
        content,
        novelId
      });

      if (response.data.success) {
        setSuccessMessage("Chapter created successfully!");
        h//istory.push(`/novels/${novelId}/chapters`); // Chuyển hướng đến danh sách chương của novel
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
            <h2 className="text-2xl font-semibold mb-4">Create New Chapter</h2>

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
                  name="title"
                  className="mt-2 p-2 w-full bg-gray-700 border border-gray-600 rounded"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="content" className="block text-sm font-medium text-gray-300">Content</label>
                <textarea
                  id="content"
                  name="content"
                  className="mt-2 p-2 w-full bg-gray-700 border border-gray-600 rounded"
                  rows="6"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="novelId" className="block text-sm font-medium text-gray-300">Novel ID</label>
                <input
                  type="text"
                  id="novelId"
                  name="novelId"
                  className="mt-2 p-2 w-full bg-gray-700 border border-gray-600 rounded"
                  value={novelId}
                  onChange={(e) => novelId(e.target.value)}
                  min="1"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Chapter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateChapter;
