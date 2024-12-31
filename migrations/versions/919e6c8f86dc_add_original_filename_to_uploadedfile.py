"""Add original_filename to UploadedFile

Revision ID: 919e6c8f86dc
Revises: dc55a2105145
Create Date: 2024-12-31 00:06:38.559553

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '919e6c8f86dc'
down_revision = 'dc55a2105145'
branch_labels = None
depends_on = None


def upgrade():
    # Step 1: Add the original_filename column as nullable
    with op.batch_alter_table('uploaded_file', schema=None) as batch_op:
        batch_op.add_column(sa.Column('original_filename', sa.String(length=255), nullable=True))
    
    # Step 2: Populate the original_filename column for existing rows
    # Assuming 'filename' column already exists and is NOT NULL
    op.execute("""
        UPDATE uploaded_file
        SET original_filename = filename
        WHERE original_filename IS NULL
    """)
    
    # Step 3: Alter the original_filename column to be NOT NULL
    with op.batch_alter_table('uploaded_file', schema=None) as batch_op:
        batch_op.alter_column('original_filename',
                               existing_type=sa.String(length=255),
                               nullable=False)


def downgrade():
    # Step 1: Drop the original_filename column
    with op.batch_alter_table('uploaded_file', schema=None) as batch_op:
        batch_op.drop_column('original_filename')
