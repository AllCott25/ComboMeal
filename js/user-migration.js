/*
 * User Migration and Account Upgrade System
 * Created by APlasker
 * Date: June 23, 2025
 * 
 * Handles upgrading anonymous accounts to email accounts while preserving data
 */

// User Migration System
const UserMigration = (function() {
  
  // Check if a user needs migration or can upgrade their account
  async function getUserMigrationStatus(userId) {
    try {
      console.log('Checking migration status for user:', userId?.substring(0, 8) + '...');
      
      const { data, error } = await supabase.rpc('check_user_migration_status', {
        target_user_id: userId
      });
      
      if (error) {
        console.error('Error checking migration status:', error);
        return null;
      }
      
      return data[0] || null;
    } catch (error) {
      console.error('Error in getUserMigrationStatus:', error);
      return null;
    }
  }
  
  // Migrate anonymous user data to a new email account
  async function migrateAnonymousToEmailAccount(anonymousUserId, newEmailUserId) {
    try {
      console.log('Migrating anonymous user to email account:', {
        from: anonymousUserId?.substring(0, 8) + '...',
        to: newEmailUserId?.substring(0, 8) + '...'
      });
      
      const { data, error } = await supabase.rpc('migrate_user_account', {
        old_user_id: anonymousUserId,
        new_user_id: newEmailUserId
      });
      
      if (error) {
        console.error('Error migrating user account:', error);
        return { success: false, error: error.message };
      }
      
      const result = data[0];
      console.log('Migration completed:', result);
      
      return {
        success: true,
        sessionsMigrated: result.sessions_migrated,
        profilesUpdated: result.profiles_updated,
        mappingUpdated: result.mapping_updated
      };
      
    } catch (error) {
      console.error('Error in migrateAnonymousToEmailAccount:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Get enhanced profile stats that work with all user types
  async function getEnhancedProfileStats(userId) {
    try {
      console.log('Getting enhanced profile stats for user:', userId?.substring(0, 8) + '...');
      
      // Use existing enhanced streak system instead of creating conflicting function
      const { data, error } = await supabase.rpc('calculate_user_streaks_v3', {
        target_user_id: userId
      });
      
      if (error) {
        console.error('Error getting enhanced profile stats:', error);
        return null;
      }
      
      return data[0] || null;
    } catch (error) {
      console.error('Error in getEnhancedProfileStats:', error);
      return null;
    }
  }
  
  // Handle account upgrade flow
  async function handleAccountUpgrade() {
    try {
      // Check if user is currently anonymous
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !user.is_anonymous) {
        console.log('User is not anonymous, no upgrade needed');
        return { success: false, message: 'User is not anonymous' };
      }
      
      const currentUserId = user.id;
      
      // Check migration status
      const migrationStatus = await getUserMigrationStatus(currentUserId);
      if (!migrationStatus || !migrationStatus.can_upgrade) {
        console.log('User cannot upgrade (no sessions to preserve)');
        return { success: false, message: 'No data to preserve' };
      }
      
      console.log('User has', migrationStatus.session_count, 'sessions to preserve');
      
      // Show upgrade modal/flow (this would be implemented in the UI)
      // For now, we'll return the migration status
      return {
        success: true,
        canUpgrade: true,
        sessionCount: migrationStatus.session_count,
        userType: migrationStatus.user_type,
        migrationNotes: migrationStatus.migration_notes
      };
      
    } catch (error) {
      console.error('Error in handleAccountUpgrade:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Complete the account upgrade after user provides email
  async function completeAccountUpgrade(email, password) {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser || !currentUser.is_anonymous) {
        throw new Error('Current user is not anonymous');
      }
      
      const anonymousUserId = currentUser.id;
      
      // Create new email account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password
      });
      
      if (signUpError) {
        throw new Error('Failed to create email account: ' + signUpError.message);
      }
      
      const newUserId = signUpData.user?.id;
      if (!newUserId) {
        throw new Error('Failed to get new user ID');
      }
      
      // Migrate data from anonymous account to email account
      const migrationResult = await migrateAnonymousToEmailAccount(anonymousUserId, newUserId);
      
      if (!migrationResult.success) {
        throw new Error('Failed to migrate user data: ' + migrationResult.error);
      }
      
      console.log('Account upgrade completed successfully:', migrationResult);
      
      return {
        success: true,
        newUserId: newUserId,
        migrationResult: migrationResult
      };
      
    } catch (error) {
      console.error('Error completing account upgrade:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Cleanup orphaned data (admin function)
  async function cleanupOrphanedData() {
    try {
      console.log('Cleaning up orphaned migration data...');
      
      const { data, error } = await supabase.rpc('cleanup_migration_data');
      
      if (error) {
        console.error('Error cleaning up orphaned data:', error);
        return { success: false, error: error.message };
      }
      
      const result = data[0];
      console.log('Cleanup completed:', result);
      
      return {
        success: true,
        mappingsRemoved: result.mappings_removed,
        orphanedSessions: result.orphaned_sessions
      };
      
    } catch (error) {
      console.error('Error in cleanupOrphanedData:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Check if current user should be prompted to upgrade
  async function shouldPromptForUpgrade() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !user.is_anonymous) {
        return false;
      }
      
      const migrationStatus = await getUserMigrationStatus(user.id);
      
      // Prompt if user has 3+ sessions (they're engaged)
      return migrationStatus && migrationStatus.session_count >= 3;
      
    } catch (error) {
      console.error('Error checking if should prompt for upgrade:', error);
      return false;
    }
  }
  
  // Public API
  return {
    getUserMigrationStatus,
    migrateAnonymousToEmailAccount,
    getEnhancedProfileStats,
    handleAccountUpgrade,
    completeAccountUpgrade,
    cleanupOrphanedData,
    shouldPromptForUpgrade
  };
})();

// Make it globally available
window.UserMigration = UserMigration;

// Auto-check for upgrade prompts when this script loads
if (typeof window !== 'undefined' && window.supabase) {
  // Check after a short delay to ensure auth is initialized
  setTimeout(() => {
    UserMigration.shouldPromptForUpgrade().then(shouldPrompt => {
      if (shouldPrompt) {
        console.log('🎯 User should be prompted to upgrade their account');
        // Could trigger a subtle notification here
        // window.showAccountUpgradePrompt?.();
      }
    }).catch(error => {
      console.log('Could not check upgrade prompt status:', error);
    });
  }, 2000);
} 