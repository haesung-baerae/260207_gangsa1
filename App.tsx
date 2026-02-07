
import React, { useState, useCallback } from 'react';
import { generateRecipe, generateFoodImage, editImageWithText } from './services/geminiService';

const App: React.FC = () => {
  const [ingredients, setIngredients] = useState('');
  const [recipe, setRecipe] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [heroError, setHeroError] = useState(false);

  const handleRecommend = useCallback(async () => {
    if (!ingredients.trim()) {
      alert('재료를 입력해주세요!');
      return;
    }

    setIsLoading(true);
    setRecipe('');
    setImageUrl('');
    
    try {
      const recipeText = await generateRecipe(ingredients);
      setRecipe(recipeText || '레시피를 생성할 수 없습니다.');
      
      // Extract title from the first line for image generation
      const titleLine = recipeText?.split('\n')[0].replace(/[#*]/g, '').trim() || ingredients;
      
      setIsImageLoading(true);
      const img = await generateFoodImage(titleLine);
      if (img) setImageUrl(img);
    } catch (error) {
      console.error(error);
      alert('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
      setIsImageLoading(false);
    }
  }, [ingredients]);

  const handleEditImage = useCallback(async () => {
    if (!editPrompt.trim() || !imageUrl) return;

    setIsEditing(true);
    try {
      const newImg = await editImageWithText(imageUrl, editPrompt);
      if (newImg) {
        setImageUrl(newImg);
        setEditPrompt('');
      } else {
        alert('이미지를 수정할 수 없었습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('이미지 수정 중 오류가 발생했습니다.');
    } finally {
      setIsEditing(false);
    }
  }, [editPrompt, imageUrl]);

  const handleDownload = useCallback(() => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `recipe-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [imageUrl]);

  const driveFolderUrl = "https://drive.google.com/drive/folders/1VdAp3F6YAH7NkWjf6pN1If6nvOPvFViJ?usp=drive_link";
  const heroImageUrl = "https://drive.google.com/thumbnail?id=1po7-OBNf5wKXMRjDjY3Q8pL_8J-N5kA7&sz=w1200";

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto flex flex-col gap-8">
      {/* Hero Image Section */}
      <div className="relative w-full h-48 md:h-72 rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-orange-100 flex items-center justify-center">
        {!heroError ? (
          <img 
            src={heroImageUrl} 
            alt="Chef Hero" 
            className="w-full h-full object-cover"
            onError={() => setHeroError(true)}
          />
        ) : (
          <div className="text-orange-400 flex flex-col items-center gap-2 px-4 text-center">
            <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="font-medium">이미지를 불러올 수 없습니다.<br/><span className="text-xs font-normal">구글 드라이브 권한 설정을 확인해주세요.</span></p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
        <div className="absolute bottom-6 left-8 text-white">
          <h2 className="text-3xl font-bold drop-shadow-lg">Gemini Recipe Chef</h2>
          <p className="text-orange-100 font-medium drop-shadow-md">AI가 추천하는 나만의 비밀 레시피</p>
        </div>
      </div>

      {/* Header & Input Section */}
      <header className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-4 z-10">
        <h1 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="bg-orange-100 p-2 rounded-lg">🥕</span>
          재료를 입력하세요
        </h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 text-lg transition-shadow"
            placeholder="예: 토마토, 달걀, 양파"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRecommend()}
          />
          <button
            onClick={handleRecommend}
            disabled={isLoading}
            className={`px-8 py-3 bg-orange-500 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center gap-2 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-600'
            }`}
          >
            {isLoading ? (
              <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5"></span>
            ) : null}
            레시피 추천받기
          </button>
        </div>
      </header>

      {/* Result Area */}
      {(recipe || isLoading) && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Recipe Text Section */}
          <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[200px]">
            <h2 className="text-xl font-bold text-gray-700 mb-6 border-b pb-4 flex items-center gap-2">
              <span className="text-2xl">📋</span> 추천 레시피
            </h2>
            {isLoading ? (
              <div className="space-y-4">
                <div className="h-6 bg-gray-100 rounded w-1/3 animate-pulse"></div>
                <div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse"></div>
              </div>
            ) : (
              <div className="prose prose-orange max-w-none whitespace-pre-wrap text-gray-800 leading-relaxed text-lg">
                {recipe}
              </div>
            )}
          </section>

          {/* Image Section */}
          <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
            <h2 className="text-xl font-bold text-gray-700 mb-6 self-start w-full border-b pb-4 flex items-center gap-2">
              <span className="text-2xl">🍳</span> 완성 이미지
            </h2>
            <div className="relative w-full aspect-square max-w-md bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shadow-inner group">
              {isImageLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm">
                  <div className="animate-spin border-4 border-orange-500 border-t-transparent rounded-full w-14 h-14"></div>
                  <p className="text-orange-600 font-bold text-lg animate-pulse">AI 셰프가 이미지를 요리하는 중...</p>
                </div>
              ) : imageUrl ? (
                <img src={imageUrl} alt="Generated Food" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-2">
                   <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="italic">레시피 생성 후 이미지가 표시됩니다.</span>
                </div>
              )}
            </div>

            {/* Image Actions & Edit Prompt */}
            {imageUrl && !isImageLoading && (
              <div className="mt-8 w-full max-w-md flex flex-col gap-6">
                {/* Save & Drive Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleDownload}
                    className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    이미지 저장 (다운로드)
                  </button>
                  <a
                    href={driveFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-center"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7.74 3.522l-.005.01L1.246 14.795l6.489 11.238 6.488-11.238L7.74 3.522zm6.488 22.511l6.494-11.238H7.74l6.488 11.238zM23.754 14.795l-6.494-11.238L10.772 14.795l6.488 11.238 6.494-11.238z" />
                    </svg>
                    드라이브 폴더 열기
                  </a>
                </div>

                {/* Edit Prompt */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-1">
                    <span className="text-orange-400">✨</span> 이미지 수정 (AI Magic)
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      placeholder="예: 파슬리 뿌려줘, 밝게 보정해줘"
                      className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                      onKeyDown={(e) => e.key === 'Enter' && handleEditImage()}
                    />
                    <button
                      onClick={handleEditImage}
                      disabled={isEditing || !editPrompt.trim()}
                      className={`px-5 py-2 bg-gray-800 text-white text-sm font-bold rounded-lg transition-all ${
                        isEditing || !editPrompt.trim() ? 'opacity-50' : 'hover:bg-black active:scale-95'
                      }`}
                    >
                      {isEditing ? '수정 중...' : '적용'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Empty State when no content */}
      {!recipe && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-300">
          <div className="bg-white p-8 rounded-full shadow-inner border border-gray-50 mb-6">
            <svg className="w-24 h-24 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
          </div>
          <p className="text-xl font-medium text-gray-400">냉장고에 남은 재료를 입력해보세요!</p>
          <p className="text-sm text-gray-300 mt-2">Gemini AI가 최고의 레시피를 제안해드립니다.</p>
        </div>
      )}

      <footer className="mt-auto py-10 border-t border-gray-100 text-center text-gray-400 text-sm">
        <p className="mb-2">Powered by Google Gemini & Generative AI</p>
        <p>&copy; 2024 Gemini Recipe Chef. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
