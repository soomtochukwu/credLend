use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use anchor_lang::system_program;

declare_id!("EpqAoepRUWzcUNmdvTuWVeoXHTbmEKuZRhWobfAbornY");

#[program]
pub mod credlend_solana {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, interest_rate_bps: u16, max_borrow_pct_bps: u16, min_loan_duration_sec: i64, max_loan_duration_sec: i64) -> Result<()> {
        let config = &mut ctx.accounts.program_config;
        let treasury_vault = &mut ctx.accounts.treasury_vault;
        config.initial_admin = ctx.accounts.admin.key();
        config.treasury_vault = treasury_vault.key();
        config.usdt_mint = ctx.accounts.usdt_mint.key();
        config.usdc_mint = ctx.accounts.usdc_mint.key();
        config.interest_rate_bps = interest_rate_bps;
        config.max_borrow_pct_bps = max_borrow_pct_bps;
        config.min_loan_duration_sec = min_loan_duration_sec;
        config.max_loan_duration_sec = max_loan_duration_sec;
        treasury_vault.bump = ctx.bumps.treasury_vault;
        emit!(InitializeEvent {
            admin: ctx.accounts.admin.key(),
            treasury_vault: treasury_vault.key(),
            usdt_mint: ctx.accounts.usdt_mint.key(),
            usdc_mint: ctx.accounts.usdc_mint.key(),
            interest_rate_bps,
            max_borrow_pct_bps,
            min_loan_duration_sec,
            max_loan_duration_sec,
        });
        Ok(())
    }

    pub fn add_admin(ctx: Context<AddAdmin>, new_admin_key: Pubkey) -> Result<()> {
        let admin_entry = &mut ctx.accounts.admin_entry;
        admin_entry.admin_key = new_admin_key;
        admin_entry.is_active = true;
        admin_entry.bump = ctx.bumps.admin_entry;
        Ok(())
    }

    pub fn whitelist_user(ctx: Context<WhitelistUser>, user_key: Pubkey) -> Result<()> {
        let whitelist_entry = &mut ctx.accounts.whitelist_entry;
        whitelist_entry.user_key = user_key;
        whitelist_entry.is_whitelisted = true;
        whitelist_entry.bump = ctx.bumps.whitelist_entry;
        Ok(())
    }

    pub fn remove_whitelist(ctx: Context<RemoveWhitelist>) -> Result<()> {
        emit!(UserWhitelistRemovedEvent {
            admin: ctx.accounts.admin.key(),
            user_key: ctx.accounts.whitelist_entry.user_key,
        });
        Ok(())
    }

    pub fn update_config(ctx: Context<UpdateConfig>, interest_rate_bps: u16, max_borrow_pct_bps: u16, min_loan_duration_sec: i64, max_loan_duration_sec: i64) -> Result<()> {
        let config = &mut ctx.accounts.program_config;
        config.interest_rate_bps = interest_rate_bps;
        config.max_borrow_pct_bps = max_borrow_pct_bps;
        config.min_loan_duration_sec = min_loan_duration_sec;
        config.max_loan_duration_sec = max_loan_duration_sec;
        emit!(ConfigUpdatedEvent {
            admin: ctx.accounts.admin.key(),
            interest_rate_bps,
            max_borrow_pct_bps,
            min_loan_duration_sec,
            max_loan_duration_sec,
        });
        Ok(())
    }

    pub fn deposit_to_treasury(ctx: Context<DepositToTreasury>, amount: u64) -> Result<()> {
        // CPI to transfer SOL
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.admin.to_account_info(),
                to: ctx.accounts.treasury_vault.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, amount)?;

        // CPI to transfer SPL tokens
        let cpi_accounts = Transfer {
            from: ctx.accounts.admin_token_account.to_account_info(),
            to: ctx.accounts.treasury_token_account.to_account_info(),
            authority: ctx.accounts.admin.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        let mint = ctx.accounts.admin_token_account.mint;
        emit!(TreasuryDepositEvent {
            admin: ctx.accounts.admin.key(),
            treasury_vault: ctx.accounts.treasury_vault.key(),
            token_mint: mint,
            amount,
        });

        Ok(())
    }

    pub fn withdraw_from_treasury(ctx: Context<WithdrawFromTreasury>, amount: u64) -> Result<()> {
        // CPI to transfer SOL
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.treasury_vault.to_account_info(),
                to: ctx.accounts.admin.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, amount)?;

        // CPI to transfer SPL tokens
        let seeds = &[&b"treasury"[..], &[ctx.accounts.treasury_vault.bump]];
        let signer = &[&seeds[..]];
        let cpi_accounts = Transfer {
            from: ctx.accounts.treasury_token_account.to_account_info(),
            to: ctx.accounts.admin_token_account.to_account_info(),
            authority: ctx.accounts.treasury_vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount)?;

        let mint = ctx.accounts.treasury_token_account.mint;
        emit!(TreasuryWithdrawalEvent {
            admin: ctx.accounts.admin.key(),
            treasury_vault: ctx.accounts.treasury_vault.key(),
            token_mint: mint,
            amount,
        });

        Ok(())
    }

    pub fn liquidate_loan(ctx: Context<LiquidateLoan>) -> Result<()> {
        let loan = &ctx.accounts.loan;
        require!(loan.is_active, ErrorCode::LoanNotActive);
        let clock = Clock::get()?;
        require!(clock.unix_timestamp > loan.loan_due_time, ErrorCode::LoanNotDueForLiquidation);

        let seeds = &[&b"collateral"[..], &loan.borrower.to_bytes(), &[ctx.accounts.collateral_vault.bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.collateral_token_account.to_account_info(),
            to: ctx.accounts.treasury_token_account.to_account_info(),
            authority: ctx.accounts.collateral_vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        let liquidated_amount = ctx.accounts.collateral_token_account.amount;
        token::transfer(cpi_ctx, liquidated_amount)?;

        emit!(LoanLiquidatedEvent {
            borrower: loan.borrower,
            loan: loan.key(),
            collateral_liquidated_amount: liquidated_amount,
        });

        Ok(())
    }

    pub fn request_loan(ctx: Context<RequestLoan>, collateral_amount: u64, loan_amount: u64, loan_duration_sec: i64, requested_loan_mint: Pubkey) -> Result<()> {
        // 1. Checks
        require!(ctx.accounts.whitelist_entry.is_whitelisted, ErrorCode::UserNotWhitelisted);
        require!(!ctx.accounts.loan.is_active, ErrorCode::LoanAlreadyActive);
        require!(loan_duration_sec >= ctx.accounts.program_config.min_loan_duration_sec && loan_duration_sec <= ctx.accounts.program_config.max_loan_duration_sec, ErrorCode::InvalidLoanDuration);
        require!(requested_loan_mint == ctx.accounts.program_config.usdc_mint || requested_loan_mint == ctx.accounts.program_config.usdt_mint, ErrorCode::InvalidLoanMint);

        // For the MVP, we are not implementing the Jupiter swap, so we will just transfer the collateral to the collateral vault
        // and assume it is USDT.

        // 2. Transfer collateral from user to collateral vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.borrower_token_account.to_account_info(),
            to: ctx.accounts.collateral_token_account.to_account_info(),
            authority: ctx.accounts.borrower.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, collateral_amount)?;

        // 3. Transfer loan from treasury to user
        let seeds = &[&b"treasury"[..], &[ctx.accounts.treasury_vault.bump]];
        let signer = &[&seeds[..]];
        let cpi_accounts = Transfer {
            from: ctx.accounts.treasury_token_account.to_account_info(),
            to: ctx.accounts.borrower_token_account.to_account_info(),
            authority: ctx.accounts.treasury_vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, loan_amount)?;

        // 4. Update loan state
        let loan = &mut ctx.accounts.loan;
        loan.borrower = ctx.accounts.borrower.key();
        loan.collateral_vault = ctx.accounts.collateral_vault.key();
        loan.collateral_locked_usdt_amount = collateral_amount;
        loan.loan_amount_borrowed = loan_amount;
        loan.loan_mint = requested_loan_mint;
        loan.repayment_amount = loan_amount + (loan_amount * ctx.accounts.program_config.interest_rate_bps as u64 / 10000);
        let clock = Clock::get()?;
        loan.loan_due_time = clock.unix_timestamp + loan_duration_sec;
        loan.is_active = true;
        loan.bump = ctx.bumps.loan;

        let collateral_vault = &mut ctx.accounts.collateral_vault;
        collateral_vault.bump = ctx.bumps.collateral_vault;

        emit!(LoanRequestedEvent {
            borrower: loan.borrower,
            loan: loan.key(),
            collateral_amount,
            loan_amount,
            loan_mint: requested_loan_mint,
            due_time: loan.loan_due_time,
        });

        Ok(())
    }

    pub fn repay_loan(ctx: Context<RepayLoan>) -> Result<()> {
        // 1. Transfer repayment from user to treasury
        let cpi_accounts = Transfer {
            from: ctx.accounts.borrower_token_account.to_account_info(),
            to: ctx.accounts.treasury_token_account.to_account_info(),
            authority: ctx.accounts.borrower.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, ctx.accounts.loan.repayment_amount)?;

        // 2. Transfer collateral from collateral vault to user
        let seeds = &[&b"collateral"[..], &ctx.accounts.loan.borrower.to_bytes(), &[ctx.accounts.collateral_vault.bump]];
        let signer = &[&seeds[..]];
        let cpi_accounts = Transfer {
            from: ctx.accounts.collateral_token_account.to_account_info(),
            to: ctx.accounts.borrower_token_account.to_account_info(),
            authority: ctx.accounts.collateral_vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, ctx.accounts.loan.collateral_locked_usdt_amount)?;

        emit!(LoanRepaidEvent {
            borrower: ctx.accounts.borrower.key(),
            loan: ctx.accounts.loan.key(),
            repayment_amount: ctx.accounts.loan.repayment_amount,
            collateral_released_amount: ctx.accounts.loan.collateral_locked_usdt_amount,
        });

        Ok(())
    }
}

#[account]
pub struct ProgramConfig {
    pub initial_admin: Pubkey,
    pub treasury_vault: Pubkey,
    pub usdt_mint: Pubkey,
    pub usdc_mint: Pubkey,
    pub interest_rate_bps: u16,
    pub max_borrow_pct_bps: u16,
    pub min_loan_duration_sec: i64,
    pub max_loan_duration_sec: i64,
}

#[account]
pub struct AdminEntry {
    pub admin_key: Pubkey,
    pub is_active: bool,
    pub bump: u8,
}

#[account]
pub struct WhitelistEntry {
    pub user_key: Pubkey,
    pub is_whitelisted: bool,
    pub bump: u8,
}

#[account]
pub struct TreasuryVault {
    pub bump: u8,
}

#[account]
pub struct Loan {
    pub borrower: Pubkey,
    pub collateral_vault: Pubkey,
    pub collateral_locked_usdt_amount: u64,
    pub loan_amount_borrowed: u64,
    pub loan_mint: Pubkey,
    pub repayment_amount: u64,
    pub loan_due_time: i64,
    pub is_active: bool,
    pub bump: u8,
}

#[account]
pub struct CollateralVault {
    pub bump: u8,
}

#[derive(Accounts)]
#[instruction(interest_rate_bps: u16, max_borrow_pct_bps: u16, min_loan_duration_sec: i64, max_loan_duration_sec: i64)]
pub struct Initialize<'info> {
    #[account(init, payer = admin, space = 8 + 148)]
    pub program_config: Account<'info, ProgramConfig>,
    #[account(init, payer = admin, seeds = [b"treasury"], bump, space = 8 + 1)]
    pub treasury_vault: Account<'info, TreasuryVault>,
    pub usdt_mint: Account<'info, Mint>,
    pub usdc_mint: Account<'info, Mint>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(new_admin_key: Pubkey)]
pub struct AddAdmin<'info> {
    #[account(init, payer = admin, space = 8 + 32 + 1 + 1, seeds = [b"admin", new_admin_key.as_ref()], bump)]
    pub admin_entry: Account<'info, AdminEntry>,
    #[account(mut, has_one = initial_admin)]
    pub program_config: Account<'info, ProgramConfig>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
    /// CHECK: This is the initial admin
    pub initial_admin: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(user_key: Pubkey)]
pub struct WhitelistUser<'info> {
    #[account(init, payer = admin, space = 8 + 32 + 1 + 1, seeds = [b"whitelist", user_key.as_ref()], bump)]
    pub whitelist_entry: Account<'info, WhitelistEntry>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RemoveWhitelist<'info> {
    #[account(mut, close = admin)]
    pub whitelist_entry: Account<'info, WhitelistEntry>,
    #[account(mut)]
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(interest_rate_bps: u16, max_borrow_pct_bps: u16, min_loan_duration_sec: i64, max_loan_duration_sec: i64)]
pub struct UpdateConfig<'info> {
    #[account(mut, has_one = initial_admin)]
    pub program_config: Account<'info, ProgramConfig>,
    #[account(mut)]
    pub admin: Signer<'info>,
    /// CHECK: This is the initial admin
    pub initial_admin: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct DepositToTreasury<'info> {
    #[account(mut)]
    pub treasury_vault: Account<'info, TreasuryVault>,
    #[account(mut)]
    pub admin_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct WithdrawFromTreasury<'info> {
    #[account(mut)]
    pub treasury_vault: Account<'info, TreasuryVault>,
    #[account(mut)]
    pub admin_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LiquidateLoan<'info> {
    #[account(mut, has_one = borrower)]
    pub loan: Account<'info, Loan>,
    #[account(mut)]
    pub collateral_vault: Account<'info, CollateralVault>,
    #[account(mut)]
    pub collateral_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    /// CHECK: This is the borrower
    pub borrower: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(collateral_amount: u64, loan_amount: u64, loan_duration_sec: i64, requested_loan_mint: Pubkey)]
pub struct RequestLoan<'info> {
    #[account(init, payer = borrower, space = 8 + 130, seeds = [b"loan", borrower.key().as_ref()], bump)]
    pub loan: Account<'info, Loan>,
    #[account(init, payer = borrower, space = 8 + 1, seeds = [b"collateral", borrower.key().as_ref()], bump)]
    pub collateral_vault: Account<'info, CollateralVault>,
    #[account(mut)]
    pub borrower: Signer<'info>,
    #[account(mut)]
    pub borrower_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub collateral_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub treasury_vault: Account<'info, TreasuryVault>,
    pub program_config: Account<'info, ProgramConfig>,
    pub whitelist_entry: Account<'info, WhitelistEntry>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RepayLoan<'info> {
    #[account(mut, has_one = borrower, close = borrower)]
    pub loan: Account<'info, Loan>,
    #[account(mut, close = borrower)]
    pub collateral_vault: Account<'info, CollateralVault>,
    #[account(mut)]
    pub borrower: Signer<'info>,
    #[account(mut)]
    pub borrower_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub collateral_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Loan is not active.")]
    LoanNotActive,
    #[msg("Loan is not due for liquidation.")]
    LoanNotDueForLiquidation,
    #[msg("User is not whitelisted.")]
    UserNotWhitelisted,
    #[msg("Loan is already active.")]
    LoanAlreadyActive,
    #[msg("Invalid loan duration.")]
    InvalidLoanDuration,
    #[msg("Invalid loan mint.")]
    InvalidLoanMint,
}


#[event]
pub struct InitializeEvent {
    pub admin: Pubkey,
    pub treasury_vault: Pubkey,
    pub usdt_mint: Pubkey,
    pub usdc_mint: Pubkey,
    pub interest_rate_bps: u16,
    pub max_borrow_pct_bps: u16,
    pub min_loan_duration_sec: i64,
    pub max_loan_duration_sec: i64,
}

#[event]
pub struct AdminAddedEvent {
    pub admin: Pubkey,
    pub new_admin_key: Pubkey,
}

#[event]
pub struct UserWhitelistedEvent {
    pub admin: Pubkey,
    pub user_key: Pubkey,
}

#[event]
pub struct UserWhitelistRemovedEvent {
    pub admin: Pubkey,
    pub user_key: Pubkey,
}

#[event]
pub struct ConfigUpdatedEvent {
    pub admin: Pubkey,
    pub interest_rate_bps: u16,
    pub max_borrow_pct_bps: u16,
    pub min_loan_duration_sec: i64,
    pub max_loan_duration_sec: i64,
}

#[event]
pub struct TreasuryDepositEvent {
    pub admin: Pubkey,
    pub treasury_vault: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
}

#[event]
pub struct TreasuryWithdrawalEvent {
    pub admin: Pubkey,
    pub treasury_vault: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
}

#[event]
pub struct LoanRequestedEvent {
    pub borrower: Pubkey,
    pub loan: Pubkey,
    pub collateral_amount: u64,
    pub loan_amount: u64,
    pub loan_mint: Pubkey,
    pub due_time: i64,
}

#[event]
pub struct LoanRepaidEvent {
    pub borrower: Pubkey,
    pub loan: Pubkey,
    pub repayment_amount: u64,
    pub collateral_released_amount: u64,
}

#[event]
pub struct LoanLiquidatedEvent {
    pub borrower: Pubkey,
    pub loan: Pubkey,
    pub collateral_liquidated_amount: u64,
}
