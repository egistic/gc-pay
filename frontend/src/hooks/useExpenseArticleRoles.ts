import { useState, useEffect } from 'react';
import { ExpenseArticleRoleService, ExpenseArticleRoleAssignment } from '../services/expenseArticleRoleService';

export const useExpenseArticleRoles = (articleId?: string, userId?: string) => {
  const [assignments, setAssignments] = useState<ExpenseArticleRoleAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAssignments = async () => {
    if (!articleId && !userId) return;

    setLoading(true);
    setError(null);

    try {
      let data: ExpenseArticleRoleAssignment[];
      
      if (articleId) {
        data = await ExpenseArticleRoleService.getArticleAssignments(articleId);
      } else if (userId) {
        data = await ExpenseArticleRoleService.getUserAssignments(userId);
      } else {
        return;
      }
      
      setAssignments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const createAssignment = async (assignment: {
    article_id: string;
    user_id: string;
    role_id: string;
    is_primary?: boolean;
    valid_from: string;
    valid_to?: string;
  }) => {
    try {
      const newAssignment = await ExpenseArticleRoleService.createAssignment(assignment);
      setAssignments(prev => [...prev, newAssignment]);
      return newAssignment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assignment');
      throw err;
    }
  };

  const updateAssignment = async (assignmentId: string, updates: {
    is_primary?: boolean;
    valid_from?: string;
    valid_to?: string;
  }) => {
    try {
      const updatedAssignment = await ExpenseArticleRoleService.updateAssignment(assignmentId, updates);
      setAssignments(prev => 
        prev.map(assignment => 
          assignment.id === assignmentId ? updatedAssignment : assignment
        )
      );
      return updatedAssignment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update assignment');
      throw err;
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    try {
      await ExpenseArticleRoleService.deleteAssignment(assignmentId);
      setAssignments(prev => prev.filter(assignment => assignment.id !== assignmentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete assignment');
      throw err;
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [articleId, userId]);

  return {
    assignments,
    loading,
    error,
    loadAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
  };
};
