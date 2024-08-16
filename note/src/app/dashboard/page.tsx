'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, database } from '@/framework/firebase';
import { signOut } from 'firebase/auth';
import { ref, push, update, remove, onValue } from 'firebase/database';
import Toast from './toast';

type Note = {
  id: string;
  title: string;
  content: string;
  category: string;
};

type Category = {
  id: string;
  name: string;
};

export default function Dashboard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editNoteId, setEditNoteId] = useState<string | null>(null);
  const [editNoteTitle, setEditNoteTitle] = useState('');
  const [editNoteContent, setEditNoteContent] = useState('');
  const [editNoteCategory, setEditNoteCategory] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<'notes' | 'categories' | 'text'>('notes');
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedNoteContent, setSelectedNoteContent] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const router = useRouter();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    const userNotesRef = ref(database, `notes/${user.uid}`);
    const userCategoriesRef = ref(database, `categories/${user.uid}`);

    const fetchNotes = () => {
      onValue(userNotesRef, (snapshot) => {
        const notesData: Note[] = [];
        snapshot.forEach((childSnapshot) => {
          const note = childSnapshot.val();
          notesData.push({
            id: childSnapshot.key as string,
            title: note.title || '',
            content: note.content,
            category: note.category || '',
          });
        });
        setNotes(notesData);
      });
    };

    fetchNotes();
    const unsubscribeNotes = onValue(userNotesRef, fetchNotes);

    const fetchCategories = () => {
      onValue(userCategoriesRef, (snapshot) => {
        const categoriesData: Category[] = [];
        snapshot.forEach((childSnapshot) => {
          const category = childSnapshot.val();
          categoriesData.push({ id: childSnapshot.key as string, name: category.name });
        });
        setCategories(categoriesData);
      });
    };

    fetchCategories();
    const unsubscribeCategories = onValue(userCategoriesRef, fetchCategories);

    return () => {
      unsubscribeNotes();
      unsubscribeCategories();
    };
  }, [router, user]);

  const handleAddNote = async () => {
    if (!user) {
      setToastMessage('ログインエラー');
      return;
    }

    if (newNoteTitle.trim() === '' || newNoteContent.trim() === '' || selectedCategory.trim() === '') {
      setToastMessage('ノートのタイトル、内容、カテゴリーを入力してください。');
      return;
    }
  
    const isDuplicateTitle = notes.some(note => note.title === newNoteTitle.trim());
    if (isDuplicateTitle) {
      setToastMessage('同じタイトルのノートがすでに存在します。');
      return;
    }
  
    try {
      const userNotesRef = ref(database, `notes/${user.uid}`);
      await push(userNotesRef, {
        title: newNoteTitle,
        content: newNoteContent,
        category: selectedCategory,
      });
      setNewNoteTitle('');
      setNewNoteContent('');
      setSelectedCategory('all');
  
      setToastMessage('ノートが正常に追加されました！');
    } catch (error) {
      setToastMessage('ノートの追加中にエラーが発生しました。');
    }
  };
  

  const handleUpdateNote = async () => {
    if (!user) {
      setToastMessage('ログインエラー');
      return;
    }

    if (editNoteId && editNoteTitle.trim() !== '' && editNoteContent.trim() !== '') {
      const noteRef = ref(database, `notes/${user.uid}/${editNoteId}`);
      await update(noteRef, {
        title: editNoteTitle,
        content: editNoteContent,
        category: editNoteCategory || 'カテゴリー',
      });
      setEditNoteId(null);
      setEditNoteTitle('');
      setEditNoteContent('');
      setEditNoteCategory('');
    }
  };

  const handleDeleteNote = async () => {
    if (!user) {
      setToastMessage('ログインエラー');
      return;
    }
    
    if (noteToDelete) {
      const noteRef = ref(database, `notes/${user.uid}/${noteToDelete}`);
      await remove(noteRef);
      setNoteToDelete(null);
    }
  };

  const handleCopyNote = (noteContent: string) => {
    navigator.clipboard
      .writeText(noteContent)
      .then(() => {
        setToastMessage('コピーしました。');
      })
      .catch((err) => {
        setToastMessage('コピー中にエラーが発生しました。');
      });
  };

  const handleCreateNote = (noteContent: string) => {
    setSelectedNoteContent(noteContent);
    setSelectedTab('text');
  };

  const handleSignOut = () => {
    signOut(auth)
      .then(() => {
        router.push('/');
      })
      .catch((error) => {
        console.error('Sign out failed: ', error);
      });
  };

  const formatNoteContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  const handleAddCategory = async () => {
    if (newCategory.trim() === '') return;

    if (!user) {
      setToastMessage('ログインエラー');
      return;
    }

    const isDuplicate = categories.some(
      (category) => category.name === newCategory.trim()
    );

    if (isDuplicate) {
      setToastMessage("同じ名前のカテゴリがすでに存在します。");
      return;
    }

    const userCategoriesRef = ref(database, `categories/${user.uid}`);
    await push(userCategoriesRef, { name: newCategory });
    setNewCategory('');
  };

  const handleEditCategory = async () => {
    if (!user) {
      setToastMessage('ログインエラー');
      return;
    }

    if (editCategoryId && editCategoryName.trim() !== '') {
      const categoryRef = ref(database, `categories/${user.uid}/${editCategoryId}`);
      await update(categoryRef, { name: editCategoryName });
      setEditCategoryId(null);
      setEditCategoryName('');
    }
  };

  const handleStartEditCategory = (categoryId: string, categoryName: string) => {
    setEditCategoryId(categoryId);
    setEditCategoryName(categoryName);
  };

  const handleStartEditNote = (noteId: string, noteTitle: string, noteContent: string, noteCategory: string) => {
    setEditNoteId(noteId);
    setEditNoteTitle(noteTitle);
    setEditNoteContent(noteContent);
    setEditNoteCategory(noteCategory);
    setSelectedTab('notes');
  };

  const handleDeleteCategory = async () => {
    if (!user) {
      setToastMessage('ログインエラー');
      return;
    }

    if (deleteCategoryId) {
      const categoryRef = ref(database, `categories/${user.uid}/${deleteCategoryId}`);
      await remove(categoryRef);
      setDeleteCategoryId(null);
    }
  };

  const filteredNotes = selectedCategory === 'all'
    ? notes
    : notes.filter((note) => note.category === selectedCategory);

  return (
    <div className="w-full h-full p-4">
      <div className='flex justify-between items-center mb-4'>
        <h1 className="text-red sm:text-3xl text-xl font-bold text-blue-300">FRIDGE</h1>
        <button
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleSignOut}
        >
          ログアウト
        </button>
      </div>

      <div className="mb-4 flex whitespace-nowrap">
        <button
          className={`px-2 py-2 mr-2 sm:px-4 ${selectedTab === 'notes' ? 'bg-blue-400' : 'bg-gray-300'} text-white font-bold rounded`}
          onClick={() => setSelectedTab('notes')}
        >
          ノート
        </button>
        <button
          className={`px-4 py-2 mr-2 ${selectedTab === 'categories' ? 'bg-blue-400' : 'bg-gray-300'} text-white font-bold rounded`}
          onClick={() => setSelectedTab('categories')}
        >
          カテゴリー
        </button>
        <button
          className={`px-4 py-2 mr-2 ${selectedTab === 'text' ? 'bg-blue-400' : 'bg-gray-300'} text-white font-bold rounded`}
          onClick={() => setSelectedTab('text')}
        >
          作成
        </button>
      </div>

      {selectedTab === 'notes' && (
        <>
          <div className="mb-4 flex flex-wrap">
            <button
              className={`px-4 py-2 mr-2 mb-2 ${selectedCategory === 'all' ? 'bg-blue-400' : 'bg-gray-300'} text-white font-bold rounded`}
              onClick={() => setSelectedCategory('all')}
            >
              すべて
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                className={`px-4 py-2 mr-2 mb-2 ${selectedCategory === category.id ? 'bg-blue-400' : 'bg-gray-300'} text-white font-bold rounded`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className='lg:flex flex-row-reverse gap-10'>
            <div className="mb-4 flex-1">
              <h2 className="text-lg font-bold mb-2">ノートリスト</h2>
              <ul>
                {filteredNotes.map((note) => (
                  <li key={note.id} className="flex flex-wrap justify-between items-center border border-gray-300 p-2 mb-2 rounded">
                    <h3 className="text-xl font-bold">{note.title}</h3>
                    <div className="flex">
                      <button
                        className="bg-blue-400 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded mr-2"
                        onClick={() => handleStartEditNote(note.id, note.title, note.content, note.category)}
                      >
                        編集
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded mr-2"
                        onClick={() => setNoteToDelete(note.id)}
                      >
                        削除
                      </button>
                      <button
                        className="bg-blue-400 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded mr-2"
                        onClick={() => handleCopyNote(note.content)}
                      >
                        コピー
                      </button>
                      <button
                        className="bg-blue-400 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                        onClick={() => handleCreateNote(note.content)}
                      >
                        作成
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mb-4 flex-1">
              <h2 className="text-lg font-bold mb-2">ノートを追加</h2>
              <input
                type="text"
                className="border border-gray-300 p-2 w-full mb-2"
                placeholder="タイトル"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
              />
              <textarea
                className="border border-gray-300 p-2 w-full mb-2 h-96"
                placeholder="内容"
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
              />
              <select
                className="border border-gray-300 p-2 w-full mb-2"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="" disabled>カテゴリーを選択</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <button
                className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded"
                onClick={handleAddNote}
              >
                追加
              </button>
            </div>
          </div>
        </>
      )}

      {selectedTab === 'categories' && (
        <>
          <div className="mb-4">
            <h2 className="text-lg font-bold mb-2">カテゴリーを追加</h2>
            <input
              type="text"
              className="border border-gray-300 p-2 w-full mb-2"
              placeholder="カテゴリー名"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <button
              className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded"
              onClick={handleAddCategory}
            >
              追加
            </button>
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-bold mb-2">カテゴリーリスト</h2>
            <ul>
              {categories.map((category) => (
                <li key={category.id} className="border border-gray-300 p-2 mb-2 rounded flex justify-between items-center">
                  <span>{category.name}</span>
                  <div className="flex">
                    <button
                      className="bg-blue-400 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded mr-2"
                      onClick={() => handleStartEditCategory(category.id, category.name)}
                    >
                      編集
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                      onClick={() => setDeleteCategoryId(category.id)}
                    >
                      削除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {selectedTab === 'text' && (
        <div className="mb-4 h-full">
          <h2 className="text-lg font-bold mb-2">テキスト</h2>
          <textarea
            className="border text-black border-gray-300 p-2 w-full h-96 mb-2"
            value={selectedNoteContent}
            onChange={(e) => setSelectedNoteContent(e.target.value)}
          />
          <button
            className="bg-blue-400 text-white py-2 px-4 rounded"
            onClick={() => handleCopyNote(selectedNoteContent)}
          >
            コピー
          </button>
        </div>
      )}

      {editNoteId && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
          <div className="bg-white p-4 rounded w-9/12 h-4/5">
            <h2 className="text-lg font-bold mb-2">ノートを編集</h2>
            <input
              type="text"
              className="border border-gray-300 p-2 w-full mb-2"
              placeholder="タイトル"
              value={editNoteTitle}
              onChange={(e) => setEditNoteTitle(e.target.value)}
            />
            <textarea
              className="border border-gray-300 p-2 w-full mb-2 sm:h-3/4 h-80 resize-none"
              placeholder="内容"
              value={editNoteContent}
              onChange={(e) => setEditNoteContent(e.target.value)}
            />
            <select
              className="border border-gray-300 p-2 w-full mb-2"
              value={editNoteCategory}
              onChange={(e) => setEditNoteCategory(e.target.value)}
            >
              <option value="" disabled>カテゴリーを選択</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <div className='flex justify-end'>
              <button
                className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded"
                onClick={handleUpdateNote}
              >
                更新
              </button>
              <button
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded ml-2"
                onClick={() => setEditNoteId(null)}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {noteToDelete && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
          <div className="bg-white p-4 rounded w-1/2">
            <h2 className="text-lg font-bold mb-2">ノートを削除</h2>
            <p className="mb-4">このノートを削除しますか？</p>
            <div className='flex justify-end'>
              <button
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                onClick={() => setNoteToDelete(null)}
              >
                キャンセル
              </button>
              <button
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ml-2"
                onClick={handleDeleteNote}
              >
                削除
              </button>
            </div>
            
          </div>
        </div>
      )}

      {deleteCategoryId && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
          <div className="bg-white p-4 rounded w-1/2">
            <h2 className="text-lg font-bold mb-2">カテゴリーを削除</h2>
            <p className="mb-4">このカテゴリーを削除しますか？</p>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              onClick={handleDeleteCategory}
            >
              削除
            </button>
            <button
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded ml-2"
              onClick={() => setDeleteCategoryId(null)}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {editCategoryId && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
          <div className="bg-white p-4 rounded w-1/2">
            <h2 className="text-lg font-bold mb-2">カテゴリーを編集</h2>
            <input
              type="text"
              className="border border-gray-300 p-2 w-full mb-2"
              placeholder="カテゴリー名"
              value={editCategoryName}
              onChange={(e) => setEditCategoryName(e.target.value)}
            />
            <button
              className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded"
              onClick={handleEditCategory}
            >
              更新
            </button>
            <button
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded ml-2"
              onClick={() => setEditCategoryId(null)}
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
}
