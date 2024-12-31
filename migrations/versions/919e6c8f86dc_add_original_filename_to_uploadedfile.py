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
    with op.batch_alter_table('uploaded_file', schema=None) as batch_op:
        # Step 1: Add the new columns as nullable
        batch_op.add_column(sa.Column('original_filename', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('file_type', sa.String(length=100), nullable=True))
    
    # Step 2: Populate the column for existing rows with default values
    op.execute("UPDATE uploaded_file SET original_filename = filename WHERE original_filename IS NULL")
    op.execute("UPDATE uploaded_file SET file_type = 'application/octet-stream' WHERE file_type IS NULL")
    
    # Step 3: Make the columns NOT NULL
    with op.batch_alter_table('uploaded_file', schema=None) as batch_op:
        batch_op.alter_column('original_filename', existing_type=sa.String(length=255), nullable=True)
        batch_op.alter_column('file_type', existing_type=sa.String(length=100), nullable=True)


def downgrade():
    with op.batch_alter_table('uploaded_file', schema=None) as batch_op:
        batch_op.drop_column('original_filename')
        batch_op.drop_column('file_type')


    # ### end Alembic commands ###
